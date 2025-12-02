import { formatDistanceToNowStrict } from "date-fns";

export const getAge = (dob: string) => {
  const today = new Date();
  const birth = new Date(dob);

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    days += 30;
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return years > 0
    ? `${years} year${years > 1 ? "s" : ""}`
    : months > 0
    ? `${months} month${months > 1 ? "s" : ""}`
    : "Less than a month";
};
