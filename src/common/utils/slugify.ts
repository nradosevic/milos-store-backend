export function slugify(text: string): string {
  const map: Record<string, string> = {
    č: 'c', ć: 'c', š: 's', ž: 'z', đ: 'dj',
    Č: 'c', Ć: 'c', Š: 's', Ž: 'z', Đ: 'dj',
  };
  return text
    .replace(/[čćšžđČĆŠŽĐ]/g, (m) => map[m] || m)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .replace(/^-+|-+$/g, '');
}
