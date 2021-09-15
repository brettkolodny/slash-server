interface commandOptions {
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

  constructor(options?: commandOptions) {
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
