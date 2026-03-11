export const getRetentionLevel = (score) => {
    if (score >= 90) return { label: 'Excellent', color: '#34C759', bg: 'rgba(52,199,89,0.1)' };
    if (score >= 70) return { label: 'Good', color: '#007AFF', bg: 'rgba(0,122,255,0.1)' };
    if (score >= 50) return { label: 'Moderate', color: '#FF9500', bg: 'rgba(255,149,0,0.1)' };
    return { label: 'Needs Improvement', color: '#FF3B30', bg: 'rgba(255,59,48,0.1)' };
};
