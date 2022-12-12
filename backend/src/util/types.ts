import { Prisma, PrismaClient } from "@prisma/client";
import { PubSub } from "graphql-subscriptions";
import { ISODateString } from "next-auth";
import {
  conversationPopulated,
  participantPopulated,
} from "../graphql/resolvers/conversation";
import { messagePopulated } from "../graphql/resolvers/message";
import { Context } from "graphql-ws/lib/server";

/**
 * Server Configuration
 */
export interface GraphQLContext {
  session: Session | null;
  prisma: PrismaClient;
  pubsub: PubSub;
}

export interface Session {
  user?: User;
  expires: ISODateString;
}

export interface SubscriptionContext extends Context {
  connectionParams: {
    session?: Session;
  };
}

/**
 * Users
 */
export interface User {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  image: string;
  name: string;
}

export interface CreateUsernameResponse {
  success?: boolean;
  error?: string;
}

/**
 * Conversations
 */
export type ConversationPopulated = Prisma.ConversationGetPayload<{
  include: typeof conversationPopulated;
}>;

export type ParticipantPopulated = Prisma.ConversationParticipantGetPayload<{
  include: typeof participantPopulated;
}>;

export interface ConversationUpdatedSubscriptionPayload {
  conversationUpdated: {
    conversation: ConversationPopulated;
  };
}

export interface ConversationDeletedSubscriptionPayload {
  conversationDeleted: ConversationPopulated;
}

/**
 * Messages
 */
export interface SendMessageArguments {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
}

export interface MessageSentSubscriptionPayload {
  messageSent: MessagePopulated;
}

export type MessagePopulated = Prisma.MessageGetPayload<{
  include: typeof messagePopulated;
}>;
