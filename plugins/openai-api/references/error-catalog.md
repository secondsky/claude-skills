# OpenAI API - Error Catalog

Common errors and solutions for OpenAI API.

## Error 1: Invalid API Key (401)
**Solution**: Verify OPENAI_API_KEY environment variable

## Error 2: Rate Limit Exceeded (429)
**Solution**: Implement exponential backoff retry

## Error 3: Model Not Found (404)
**Solution**: Use correct model names (gpt-4o, gpt-4o-mini, o1-preview, o1-mini)

## Error 4: Context Length Exceeded (400)
**Solution**: Reduce input or use larger context model

## Error 5: Invalid JSON in Tool Calls
**Solution**: Ensure function declarations have correct JSON schema
