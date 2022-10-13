import { ApolloServer } from "apollo-server-express";
import {
  ApolloServerPluginDrainHttpServer,
  ApolloServerPluginLandingPageLocalDefault,
} from "apollo-server-core";
import { makeExecutableSchema } from "@graphql-tools/schema";
import express from "express";
import http from "http";
import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";
import { getSession } from "next-auth/react";
import { PrismaClient } from "@prisma/client";
import { PubSub } from "graphql-subscriptions";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import * as dotenv from "dotenv";
import { GraphQLContext, Session, SubscriptionContext } from "./util/types";

async function main() {
  dotenv.config();
  const app = express();
  const httpServer = http.createServer(app);

  const corsOptions = {
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  };

  // Create our WebSocket server using the HTTP server we just set up.
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: "/graphql/subscriptions",
  });

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  /**
   * Context parameters
   */
  const prisma = new PrismaClient();
  const pubsub = new PubSub();

  // Save the returned server's info so we can shutdown this server later
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx: SubscriptionContext) => {
        // ctx is the graphql-ws Context where connectionParams live
        if (ctx.connectionParams && ctx.connectionParams.session) {
          console.log("SERVER CONTEXT", ctx.connectionParams);

          const { session } = ctx.connectionParams;
          return { session, prisma, pubsub };
        }
        // Otherwise let our resolvers know we don't have a current user
        return { session: null, prisma, pubsub };
      },
    },
    wsServer
  );

  const server = new ApolloServer({
    schema,
    csrfPrevention: true,
    cache: "bounded",
    context: async ({ req, res }): Promise<GraphQLContext> => {
      const session = (await getSession({ req })) as Session;

      res.header("Access-Control-Allow-Origin", process.env.CLIENT_ORIGIN);

      return { session, prisma, pubsub };
    },
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
      ApolloServerPluginLandingPageLocalDefault({ embed: true }),
    ],
  });
  await server.start();
  server.applyMiddleware({ app, path: "/graphql", cors: corsOptions });

  const PORT = 4000;
  // Now that our HTTP server is fully set up, we can listen to it.
  httpServer.listen(PORT, () => {
    console.log(
      `🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`
    );
  });
}

main().catch((err) => console.log(err));
