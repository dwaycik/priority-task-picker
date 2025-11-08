import { Trigger } from "deno-slack-api/types.ts";
import { TriggerContextData, TriggerTypes } from "deno-slack-api/mod.ts";
import PriorityTaskWorkflow from "../workflows/priority_task_workflow.ts";

const priorityTaskTrigger: Trigger<typeof PriorityTaskWorkflow.definition> = {
  type: TriggerTypes.Shortcut,
  name: "Task Picker",
  description: "Get your highest priority task",
  workflow: `#/workflows/${PriorityTaskWorkflow.definition.callback_id}`,
  inputs: {
    interactivity: {
      value: TriggerContextData.Shortcut.interactivity,
    },
    channel_id: {
      value: TriggerContextData.Shortcut.channel_id,
    },
  },
};

export default priorityTaskTrigger;
