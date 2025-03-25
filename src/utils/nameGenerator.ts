export const generateFunkyName = () => {
  const adjectives = ["Funky", "Crazy", "Cool", "Awesome", "Wild", "Silly"];
  const nouns = ["Stranger", "User", "Buddy", "Pal", "Mate", "Friend"];
  const randomNumber = Math.floor(Math.random() * 1000);
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective}${noun}${randomNumber}`;
};
