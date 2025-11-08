import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const SendTaskMessageDefinition = DefineFunction({
  callback_id: "send_task_message",
  title: "Send Task Message",
  description: "Send a message with interactive blocks",
  source_file: "functions/send_task_message.ts",
  input_parameters: {
    properties: {
      channel_id: {
        type: Schema.slack.types.channel_id,
        description: "Channel to send message to",
      },
blocks: {
  type: Schema.types.array,
  items: {
    type: Schema.types.string,
  },
  description: "Message blocks",
},
    },
    required: ["channel_id", "blocks"],
  },
  output_parameters: {
    properties: {},
    required: [],
  },
});

export default SlackFunction(
  SendTaskMessageDefinition,
	  async ({ inputs, client }) => {
	try {
	  console.log("Sending message to channel:", inputs.channel_id);
	  console.log("Number of blocks:", inputs.blocks.length);
	  
	  const parsedBlocks = inputs.blocks.map((b: string) => JSON.parse(b));
	  
	  await client.chat.postMessage({
	    channel: inputs.channel_id,
	    blocks: parsedBlocks,
	    text: "Your priority task"
	  });
	  
	  return { outputs: {} };
	} catch (error) {
      console.log("ERROR sending message:", error);
      return { error: `Failed to send message: ${error.message}` };
    }
  },
);
