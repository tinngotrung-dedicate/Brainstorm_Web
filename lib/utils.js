export const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const makeId = (label) => {
  const base = slugify(label || 'group');
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
};

export const makeInviteCode = () =>
  Math.random().toString(36).replace(/[^a-z0-9]/g, '').slice(2, 8).toUpperCase();

export const formatRelative = (dateString) => {
  if (!dateString) return 'Cập nhật vừa xong';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Cập nhật vừa xong';
  return date.toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};
