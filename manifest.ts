import { Manifest } from "deno-slack-sdk/mod.ts";
import PriorityTaskWorkflow from "./workflows/priority_task_workflow.ts";
import RandomTaskWorkflow from "./workflows/random_task_workflow.ts";
import { GetPriorityTaskDefinition } from "./functions/get_priority_task.ts";
import { SendTaskMessageDefinition } from "./functions/send_task_message.ts";

export default Manifest({
  name: "priority-task-picker",
  description: "Get your next priority task",
  icon: "assets/default_new_app_icon.png",
  workflows: [PriorityTaskWorkflow, RandomTaskWorkflow],
  functions: [GetPriorityTaskDefinition, SendTaskMessageDefinition],
  outgoingDomains: [],
botScopes: [
  "commands",
  "chat:write",
  "chat:write.public",
  "lists:read",
  "lists:write",
],
});
