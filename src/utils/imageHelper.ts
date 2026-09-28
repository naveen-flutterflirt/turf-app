export const getTurfImageUri = (images: any): string => {
  if (!images) return '';
  let parsed = images;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {
      return parsed.startsWith('http') ? parsed : '';
    }
  }
  if (Array.isArray(parsed) && parsed.length > 0) {
    const item = parsed[0];
    return typeof item === 'string' ? item : (item?.image_url || item?.url || item?.uri || '');
  }
  return '';
};

export const getTurfImageUris = (images: any): string[] => {
  if (!images) return [];
  let parsed = images;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {
      return parsed.startsWith('http') ? [parsed] : [];
    }
  }
  if (Array.isArray(parsed)) {
    return parsed.map((item: any) => {
      return typeof item === 'string' ? item : (item?.image_url || item?.url || item?.uri || '');
    }).filter(Boolean);
  }
  return [];
};
