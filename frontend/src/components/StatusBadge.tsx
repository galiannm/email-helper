import type { EmailStatus } from '../lib/api';

const styles: Record<EmailStatus, string> = {
  new:        'bg-gray-100 text-gray-600',
  processing: 'bg-yellow-50 text-yellow-700',
  ready:      'bg-acacia-blue-highlight text-acacia-blue-text',
  sent:       'bg-green-50 text-green-700',
  error:      'bg-acacia-red-highlight text-acacia-red-text',
};

const labels: Record<EmailStatus, string> = {
  new:        'New',
  processing: 'Processing…',
  ready:      'Ready',
  sent:       'Sent',
  error:      'Error',
};

export function StatusBadge({ status }: { status: EmailStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

const campusStyles: Record<string, string> = {
  SATHORN:             'bg-acacia-orange-highlight text-acacia-orange-text',
  SUKHUMVIT:           'bg-acacia-orange-highlight text-acacia-orange-text',
  BANGKOK_UNSPECIFIED: 'bg-acacia-orange-highlight text-acacia-orange-text',
  HANOI_TAYHO:         'bg-acacia-blue-highlight text-acacia-blue-text',
  HANOI_LONGBIEN:      'bg-acacia-blue-highlight text-acacia-blue-text',
  HANOI_UNSPECIFIED:   'bg-acacia-blue-highlight text-acacia-blue-text',
  PHNOM_PENH:          'bg-acacia-purple-highlight text-acacia-purple-text',
  UNKNOWN:             'bg-gray-100 text-gray-500',
};

const campusShort: Record<string, string> = {
  SATHORN:             'Sathorn',
  SUKHUMVIT:           'Sukhumvit',
  BANGKOK_UNSPECIFIED: 'Bangkok',
  HANOI_TAYHO:         'Tay Ho',
  HANOI_LONGBIEN:      'Long Bien',
  HANOI_UNSPECIFIED:   'Hanoi',
  PHNOM_PENH:          'Phnom Penh',
  UNKNOWN:             '?',
};

export function CampusBadge({ campus }: { campus?: string | null }) {
  if (!campus) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${campusStyles[campus] ?? 'bg-gray-100 text-gray-500'}`}>
      {campusShort[campus] ?? campus}
    </span>
  );
}

export function LangBadge({ lang }: { lang?: string | null }) {
  if (!lang) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${lang === 'fr' ? 'bg-indigo-50 text-indigo-700' : 'bg-sky-50 text-sky-700'}`}>
      {lang.toUpperCase()}
    </span>
  );
}
