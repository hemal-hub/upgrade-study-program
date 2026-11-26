export interface ImageCompressOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
  maxDataUrlChars?: number;
  preserveTransparency?: boolean;
}

/**
 * Compresses an uploaded image File into a compact Data URL safely bounded
 * for Firestore document storage (never exceeding Firestore limits).
 */
export function compressImageFile(
  file: File,
  options: ImageCompressOptions,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (JPG, PNG, WebP বা SVG) নির্বাচন করুন।'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('ছবি পড়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'));
    reader.onload = () => {
      const rawUrl = String(reader.result ?? '');
      if (file.type === 'image/svg+xml' && rawUrl.length <= (options.maxDataUrlChars ?? 160000)) {
        resolve(rawUrl);
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('ছবিটি সঠিক ফরম্যাটে নেই।'));
      img.onload = () => {
        const ratio = Math.min(
          1,
          options.maxWidth / Math.max(1, img.width),
          options.maxHeight / Math.max(1, img.height),
        );
        const width = Math.max(1, Math.round(img.width * ratio));
        const height = Math.max(1, Math.round(img.height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('ছবি প্রক্রিয়াকরণ করা যায়নি।'));
          return;
        }

        if (!options.preserveTransparency) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(img, 0, 0, width, height);

        const mime = options.preserveTransparency ? 'image/webp' : 'image/jpeg';
        let quality = options.quality ?? 0.74;
        let dataUrl = canvas.toDataURL(mime, quality);
        const limit = options.maxDataUrlChars ?? 160000;

        while (dataUrl.length > limit && quality > 0.35) {
          quality = Number((quality - 0.1).toFixed(2));
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (dataUrl.length > limit) {
          reject(new Error('ছবির আকার অনেক বড়। অনুগ্রহ করে তুলনামূলক ছোট ছবি আপলোড করুন।'));
          return;
        }

        resolve(dataUrl);
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  });
}

const AVATAR_PALETTES = [
  { bg: '#F4EAEB', fg: '#7A0D14', ring: '#E5D0D2' },
  { bg: '#F5EFE2', fg: '#9A6B19', ring: '#E6D6B8' },
  { bg: '#EAF1EE', fg: '#166534', ring: '#CBE0D4' },
  { bg: '#ECEFF5', fg: '#1E3A5F', ring: '#CFD8E8' },
  { bg: '#F3ECE8', fg: '#6B3410', ring: '#E2D1C6' },
  { bg: '#EEEBF4', fg: '#4C1D95', ring: '#D8CEEA' },
];

/**
 * Generates a crisp, deterministic passport-style SVG avatar data URI
 * for student fallback portraits without relying on external URLs.
 */
export function createStudentAvatarSvg(studentName: string, paletteIndex = 0): string {
  const palette = AVATAR_PALETTES[Math.abs(paletteIndex) % AVATAR_PALETTES.length];
  const initial = (studentName.trim().charAt(0) || 'শ').replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160"><rect width="160" height="160" fill="${palette.bg}"/><circle cx="80" cy="62" r="30" fill="${palette.ring}"/><path d="M26 154c6-30 28-46 54-46s48 16 54 46" fill="${palette.ring}"/><text x="80" y="75" text-anchor="middle" font-family="sans-serif" font-size="38" font-weight="700" fill="${palette.fg}">${initial}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
