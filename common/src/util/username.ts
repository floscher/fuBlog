const usernameRegex = /^[a-zA-Z._-]{3,32}$/g;
const notAllowedChar = /[^a-zA-Z._-]+/g;
const combining = /[\u0300-\u036F]/g;

export function isValidUsername(username: string): boolean {
  return usernameRegex.test(username);
}

export function convertToUsername(input: string): string | undefined {
  const username = input
    .normalize("NFKD") // replace special characters with similar ones (ñ → n, á → a, …)
    .replace(combining, "") // remove combining marks
    .replace(" ", ".") // space to dot
    .toLowerCase()
    .replace("ä", "a")
    .replace("ö", "oe")
    .replace("ü", "ue")
    .replace("ß", "ss")
    .replace(notAllowedChar, "") // remove chars that are not allowed in usernames
    .substring(0, 32);
  if (username.length < 3) {
    return undefined;
  } else if (username.length > 32) {
    return username.substring(0, 32);
  }
  return username;
}
