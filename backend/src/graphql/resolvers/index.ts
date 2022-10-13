import userResolvers from "./user";
import conversationResolvers from "./conversation";
import merge from "lodash.merge";
// import scalarResolvers from "./scalars";

const resolvers = merge({}, userResolvers, conversationResolvers);

export default resolvers;
