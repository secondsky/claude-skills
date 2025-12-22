export default {
  async fetch(request, env, ctx) {
    const agent = {
      tools: [
        {
          name: 'getInfo',
          handler: async () => ({ info: 'data' })
        }
      ],
      async run(input) {
        return await processWithTools(input, this.tools);
      }
    };
    
    return new Response(JSON.stringify(await agent.run(await request.text())));
  }
};
