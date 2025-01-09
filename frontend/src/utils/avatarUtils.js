export const generateAvatarData = (name) => {
  if (!name) return { initials: '?', color: '#4B5563' };
  
  // Generate initials from name
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  // Predefined colors for avatars
  const colors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // yellow
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#6366F1', // indigo
    '#14B8A6'  // teal
  ];
  
  // Generate consistent color based on name
  const colorIndex = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  
  return {
    initials,
    color: colors[colorIndex]
  };
}; 