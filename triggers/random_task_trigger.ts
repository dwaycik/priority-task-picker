import { Trigger } from "deno-slack-api/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import RandomTaskWorkflow from "../workflows/random_task_workflow.ts";

const randomTaskTrigger: Trigger<typeof RandomTaskWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Something Else",
  description: "Get any random task assigned to you",
  workflow: `#/workflows/${RandomTaskWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    channel_id: {
      value: TriggerContextData.Shortcut.channel_id,
    },
  },
};

export default randomTaskTrigger;
