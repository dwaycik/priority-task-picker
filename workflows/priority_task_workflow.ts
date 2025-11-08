import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { GetPriorityTaskDefinition } from "../functions/get_priority_task.ts";
import { SendTaskMessageDefinition } from "../functions/send_task_message.ts";

export const PriorityTaskWorkflow = DefineWorkflow({
  callback_id: "priority_task_workflow",
  title: "Get Priority Task Workflow",
  description: "Get your next priority task",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      channel_id: {
        type: Schema.slack.types.channel_id,
      },
      skip_tier: {
        type: Schema.types.number,
        description: "Priority tier to skip",
        default: 0,
      },
    },
    required: ["interactivity", "channel_id"],
  },
});

const taskStep = PriorityTaskWorkflow.addStep(
  GetPriorityTaskDefinition,
  {
    user_id: PriorityTaskWorkflow.inputs.interactivity.interactor.id,
    skip_tier: PriorityTaskWorkflow.inputs.skip_tier,
  },
);

PriorityTaskWorkflow.addStep(
  SendTaskMessageDefinition,
  {
    channel_id: PriorityTaskWorkflow.inputs.channel_id,
    blocks: taskStep.outputs.blocks,
  },
);

export default PriorityTaskWorkflow;
