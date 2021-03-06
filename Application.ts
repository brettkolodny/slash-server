import { Command, CommandGroup } from "./Command.ts";
import { verifySignature } from "./utils.ts";
import { listenAndServe } from "https://deno.land/std@0.112.0/http/server.ts";

interface ApplicationSettings {
  id: string;
  key: string;
  token: string;
}

export class Application {
  private appId: string;
  private appPublicKey: string;
  private token: string;
  private commands: Command[];

  constructor(settings: ApplicationSettings, commands: Command[]) {
    this.appId = settings.id;
    this.appPublicKey = settings.key;
    this.token = settings.token;
    this.commands = commands;
  }

  private async handleRequest(request: Request): Promise<Response> {
    if (!(await verifySignature(request, this.appPublicKey)).valid) {
      return new Response(null, {
        status: 405,
        statusText: "Not allowed",
      });
    }

    if (request.method !== "POST") {
      return new Response(null, {
        status: 405,
        statusText: "Method Not Allowed",
      });
    }

    if (!request.headers.has("content-type")) {
      return new Response(
        JSON.stringify({ error: "please provide 'content-type' header" }),
        {
          status: 400,
          statusText: "Bad Request",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
        }
      );
    }

    const contentType = request.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const { type, data } = await request.json();

      if (type) {
        if (type === 1) {
          return new Response(JSON.stringify({ type: 1 }), {
            headers: {
              "Content-Type": "application/json;",
            },
            status: 200,
          });
        }

        if (data && data.name) {
          let command = this.commands.find(
            (command) => command.name === data.name
          );

          if (!command) {
            console.error("No Response");
            return new Response(null, {
              status: 404,
              statusText: "Not Found",
            });
          }

          if (data.options) {
            const [{ name }] = data.options;
            command = (command as CommandGroup).commands.find(
              (val) => val.name === name
            );
          }

          if (!command || !command.response) {
            console.error("No Response");
            return new Response(null, {
              status: 404,
              statusText: "Not Found",
            });
          }

          const commandResponse =
            typeof command.response === "string"
              ? command.response
              : await command.response();

          if (command) {
            return new Response(
              JSON.stringify({
                type: 4,
                data: {
                  tts: false,
                  embeds: [
                    {
                      title: `**${command.description}**`,
                      type: "rich",
                      description: commandResponse,
                      footer: {
                        text: command.name,
                      },
                      color: 0xff4c3b,
                    },
                  ],
                  allowed_mentions: { parse: [] },
                },
              }),
              {
                headers: { "Content-Type": "application/json;" },
                status: 200,
              }
            );
          }
        }
      }

      return new Response(null, {
        status: 404,
        statusText: "Not Found",
      });
    }

    return new Response(null, {
      status: 415,
      statusText: "Unsupported Media Type",
    });
  }

  private initCommands(): void {
    let delay = 1;

    this.commands.forEach((command) => {
      if (!command.serverId) {
        console.error(`No guild specified for ${command.name}`);
      }

      setTimeout(() => {
        const url = `https://discord.com/api/v8/applications/${this.appId}/guilds/${command.serverId}/commands`;
        const commandJson = JSON.stringify(command);
        console.log(commandJson);

        fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bot ${this.token}`,
            "Content-Type": "application/json",
          },
          body: commandJson,
        })
          .then((res) => {
            if (!res.ok) {
              console.error(`Could not initialize command: ${res.status}}`);
            }
          })
          .catch((error: Error) => {
            console.error(`Could not initialize command: ${error.message}`);
          });
      }, delay * 1000);

      delay += 5;
    });
  }

  public async start() {
    this.initCommands();
    await listenAndServe(":8080", (req) => {
      return this.handleRequest(req);
    })
  }
}
