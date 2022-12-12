import { Button, Flex, Stack, Text } from "@chakra-ui/react";
import React, { useContext } from "react";
import { BiMessageSquareDots } from "react-icons/bi";
import { ConversationsData } from "../../../util/types";
import ConversationOperations from "../../../graphql/operations/conversation";
import { useQuery } from "@apollo/client";

const NoConversation: React.FC = () => {
  const { data, loading, error } = useQuery<ConversationsData, null>(
    ConversationOperations.Queries.conversations
  );

  if (!data?.conversations || loading || error) return null;

  const { conversations } = data;

  const hasConversations = conversations.length;

  const text = hasConversations
    ? "Select a Conversation"
    : "Let's Get Started 🥳";

  return (
    <Flex height="100%" justify="center" align="center">
      <Stack spacing={10} align="center">
        <Text fontSize={40}>{text}</Text>
        <BiMessageSquareDots fontSize={90} />
      </Stack>
    </Flex>
  );
};
export default NoConversation;
