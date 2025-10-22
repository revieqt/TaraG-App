// utils/formatDateToString.ts

/**
 * Formats a given date into a human-readable string like "December 16, 2024".
 * 
 * @param dateInput - A Date object or a valid date string.
 * @returns A formatted date string.
 * 
 * Example:
 * formatDateToString(new Date()); // "October 23, 2025"
 * formatDateToString("2024-12-16"); // "December 16, 2024"
 */
export const formatDateToString = (dateInput: Date | string): string => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);

  if (isNaN(date.getTime())) {
    console.warn("Invalid date provided to formatDateToString");
    return "";
  }

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return date.toLocaleDateString("en-US", options);
};
