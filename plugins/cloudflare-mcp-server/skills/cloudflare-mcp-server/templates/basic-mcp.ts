import { McpServer } from '@modelcontextprotocol/sdk';

const server = new McpServer({
  name: 'my-mcp-server',
  version: '1.0.0'
});

server.tool('getTodo', async ({ id }) => {
  return { id, title: 'Task', completed: false };
});

export default server;
