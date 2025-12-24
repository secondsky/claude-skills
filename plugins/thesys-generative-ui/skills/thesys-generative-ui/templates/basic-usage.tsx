import { generateUI } from 'thesys';

const ui = await generateUI({
  prompt: 'Create a user profile card',
  schema: {
    type: 'component',
    props: ['name', 'email', 'avatar']
  }
});

export default function Profile() {
  return <div>{ui}</div>;
}
