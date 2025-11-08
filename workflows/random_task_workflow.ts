import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { GetPriorityTaskDefinition } from "../functions/get_priority_task.ts";
import { SendTaskMessageDefinition } from "../functions/send_task_message.ts";

export const RandomTaskWorkflow = DefineWorkflow({
  callback_id: "random_task_workflow",
  title: "Get Random Task",
  description: "Get any random task assigned to you",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel_id: {
        type: Schema.slack.types.channel_id,
      },
    },
    required: ["interactivity", "channel_id"],
  },
});

const taskStep = RandomTaskWorkflow.addStep(
  GetPriorityTaskDefinition,
  {
    user_id: RandomTaskWorkflow.inputs.interactivity.interactor.id,
    skip_tier: 999,
  },
);

RandomTaskWorkflow.addStep(
  SendTaskMessageDefinition,
  {
    channel_id: RandomTaskWorkflow.inputs.channel_id,
    blocks: taskStep.outputs.blocks,
  },
);

export default RandomTaskWorkflow;

