interface CommandOptions {
  name?: string;
  description?: string;
  response?: string | (() => Promise<string>);
  serverId?: string;
}

export class Command {
  public name: string | null;
  public description: string | null;
  public response: string | (() => Promise<string>) | null;
  public serverId: string | null;

  constructor(options?: CommandOptions) {
    this.name = (options && options.name) || null;
    this.description = (options && options.description) || null;
    this.response = (options && options.response) || null;
    this.serverId = (options && options.serverId) || null;
  }

  public toJSON(): {
    name: string;
    description: string;
  } {
    if (this.name && this.description && this.response) {
      return {
        name: this.name,
        description: this.description,
      };
    }

    throw Error("Command requires name, description, and response");
  }
}

export class CommandGroup extends Command {
  public commands: Command[];
  constructor(name: string, description: string, serverId: string, commands: Command[]) {
    super({ name, description });
    this.commands = commands;
    this.serverId = serverId;
  }

  public toJSON(): {
    name: string;
    description: string;
    options: Array<{ name: string; description: string; type: number }>;
  } {
    if (this.name && this.description) {
      const commandsJSON = this.commands.map((command) => ({
        ...command.toJSON(),
        type: 1,
      }));

      return {
        name: this.name,
        description: this.description,
        options: commandsJSON,
      };
    }

    throw Error("Command requires name, description, and response");
  }
}
