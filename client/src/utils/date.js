export const formatDateInputValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDaysToDateInputValue = (dateValue, daysToAdd = 0) => {
  if (!dateValue) return '';

  const [year, month, day] = String(dateValue).split('-').map(Number);

  if ([year, month, day].some((value) => Number.isNaN(value))) {
    return dateValue;
  }

  const nextDate = new Date(year, month - 1, day);
  nextDate.setDate(nextDate.getDate() + daysToAdd);

  return formatDateInputValue(nextDate);
};

export const formatFriendlyDate = (value) => {
  if (!value) return 'Not scheduled';

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
