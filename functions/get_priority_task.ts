import { DefineFunction, Schema, SlackFunction } from "deno-slack-sdk/mod.ts";

export const GetPriorityTaskDefinition = DefineFunction({
  callback_id: "get_priority_task",
  title: "Get Priority Task",
  description: "Get a random task from the highest priority tier",
  source_file: "functions/get_priority_task.ts",
  input_parameters: {
    properties: {
      user_id: {
        type: Schema.slack.types.user_id,
        description: "The user requesting the task",
      },
      skip_tier: {
        type: Schema.types.number,
        description: "Priority tier to skip (optional)",
      },
    },
    required: ["user_id"],
  },
  output_parameters: {
    properties: {
      task_message: {
        type: Schema.types.string,
        description: "The formatted task message",
      },
      selected_tier: {
        type: Schema.types.number,
        description: "The priority tier that was selected",
      },
      has_next_tier: {
        type: Schema.types.boolean,
        description: "Whether there is a next tier available",
      },
      blocks: {
        type: Schema.types.array,
        items: {
          type: Schema.types.string,	
        },
        description: "Message blocks",
      },
    },
    required: ["task_message", "selected_tier", "has_next_tier", "blocks"],
  },
});

function extractPriorityNumber(text: string): number | null {
  const match = text.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export default SlackFunction(
  GetPriorityTaskDefinition,
  async ({ inputs, client, env }) => {
    const LIST_ID = env.SLACK_LIST_ID;
    console.log("FUNCTION STARTED - LIST_ID:", LIST_ID);
    const CRITICALITY_COLUMN_ID = env.CRITICALITY_COLUMN_ID || "Col09QZ5QTZ55";
    
    const OPTION_MAP = env.CRITICALITY_OPTION_MAP 
      ? JSON.parse(env.CRITICALITY_OPTION_MAP)
      : {};
    
    if (!LIST_ID) {
      return { error: "SLACK_LIST_ID environment variable not set" };
    }

    try {
      const listResponse = await client.apiCall("slackLists.items.list", {
        list_id: LIST_ID,
      });

      if (!listResponse.ok) {
        return { error: `Failed to fetch list: ${listResponse.error}` };
      }

      const items = listResponse.items || [];
      
      if (items.length === 0) {
        return { 
          outputs: { 
            task_message: "No tasks found in the list!",
            selected_tier: 0,
            has_next_tier: false,
            blocks: [],
          } 
        };
      }

      const userItems = items.filter((item: any) => {
        const assigneeField = item.fields?.find((f: any) => 
          f.key?.toLowerCase().includes("assignee")
        );
        return assigneeField?.user?.includes(inputs.user_id);
      });

      if (userItems.length === 0) {
        return { 
          outputs: { 
            task_message: "No tasks assigned to you!",
            selected_tier: 0,
            has_next_tier: false,
            blocks: [],
          } 
        };
      }

      const byPriority: Map<number, any[]> = new Map();

      userItems.forEach((item: any) => {
        const critField = item.fields?.find((f: any) => f.key === CRITICALITY_COLUMN_ID);

        if (critField && critField.value) {
          const critText = OPTION_MAP[critField.value] || "";
          
          if (critText) {
            const priorityNum = extractPriorityNumber(critText);
            if (priorityNum !== null) {
              if (!byPriority.has(priorityNum)) {
                byPriority.set(priorityNum, []);
              }
              byPriority.get(priorityNum)!.push({
                ...item,
                priorityText: critText,
                priorityNum: priorityNum
              });
            }
          }
        }
      });

      if (byPriority.size === 0) {
        return { 
          outputs: { 
            task_message: "No tasks found with valid priority levels!",
            selected_tier: 0,
            has_next_tier: false,
            blocks: [],
          } 
        };
      }

      const sortedPriorities = Array.from(byPriority.keys()).sort((a, b) => a - b);

      let targetPriority: number;
      const skipTier = inputs.skip_tier || 0;

      if (skipTier === 999) {
        const randomTierIndex = Math.floor(Math.random() * sortedPriorities.length);
        targetPriority = sortedPriorities[randomTierIndex];
      } else if (skipTier > 0) {
        const availablePriorities = sortedPriorities.filter(p => p !== skipTier);
        if (availablePriorities.length > 0) {
          targetPriority = availablePriorities[0];
        } else {
          targetPriority = sortedPriorities[0];
        }
      } else {
        targetPriority = sortedPriorities[0];
      }

      const targetItems = byPriority.get(targetPriority)!;
      const randomIndex = Math.floor(Math.random() * targetItems.length);
      const selected = targetItems[randomIndex];

      const titleField = selected.fields?.find((f: any) => f.key === "name");
      const taskTitle = titleField?.text || "Untitled Task";
      
      const descField = selected.fields?.find((f: any) => f.key?.includes("QZ5FD2LF"));
      const taskDesc = descField?.text || "";
      
      const dueField = selected.fields?.find((f: any) => f.key?.toLowerCase().includes("due"));
      const dueDate = dueField?.date?.[0] || "";
      
      const taskLink = `https://thebackchannel-group.slack.com/lists/T03236M2GD7/${LIST_ID}?record_id=${selected.id}`;

      let message = `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `🎯 *YOUR NEXT PRIORITY TASK*\n`;
      message += `Priority Level: *${selected.priorityText}*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `*${taskTitle}*\n`;

      if (taskDesc) {
        message += `\n${taskDesc}\n`;
      }

      if (dueDate) {
        message += `\n📅 *Due:* ${dueDate}\n`;
      }

      message += `\n:point_right: *<${taskLink}|OPEN THIS TASK IN SLACK>* :point_left:\n`;

      if (targetItems.length > 1) {
        message += `\n_${targetItems.length - 1} other task(s) at this priority level_\n`;
      }

      const currentIndex = sortedPriorities.indexOf(targetPriority);
      const hasNextTier = currentIndex < sortedPriorities.length - 1;

      const blocks: any[] = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: message
          }
        }
      ];

      if (hasNextTier) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `\n━━━━━━━━━━━━━━━━━━━━\n💡 *TOO MUCH RIGHT NOW?*\nGet a different task\n━━━━━━━━━━━━━━━━━━━━`
          },
          accessory: {
            type: "workflow_button",
            text: {
              type: "plain_text",
              text: "🔄 Get Different Task"
            },
            workflow: {
              trigger: {
                url: "https://slack.com/shortcuts/Ft09SHH72TFA/8e734e6450dc75d34763c9700a135442"
              }
            }
          }
        });
      }

      return { 
        outputs: { 
          task_message: message,
          selected_tier: targetPriority,
          has_next_tier: hasNextTier,
          blocks: blocks.map(b => JSON.stringify(b)),
        } 
      };
    } catch (error) {
      console.log("ERROR:", error);
      return { error: `Error: ${error.message}` };
    }
  },
);
