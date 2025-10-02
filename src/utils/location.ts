export const extractCity = (
  components: any,
  formatted?: string,
  fallback?: string
): string => {
  if (!components && !formatted && !fallback) {
    return '';
  }

  const normalizeSegment = (value: string) => {
    return value
      .replace(/\b\d{5}\b/g, '') // rimuovi CAP
      .replace(/\d+/g, '') // rimuovi numeri civici
      .replace(/\b[A-Z]{2}\b/g, '') // rimuovi sigle province
      .replace(/\bNAZ?\b/gi, '') // rimuovi eventuali abbreviazioni nazionali
      .trim();
  };

  const isStreet = (value: string) =>
    /^(via|viale|piazza|corso|lungo|strada|contrada|traversa|vicolo|sc|ss|sp|autostrada|bastioni|largo|piazzale)/i.test(
      value
    );

  const pickSegment = (value: string) => {
    if (!value) return '';

    const parts = value
      .split(',')
      .map(part => normalizeSegment(part))
      .map(part => part.replace(/\s{2,}/g, ' '))
      .map(part => part.trim())
      .filter(Boolean);

    if (!parts.length) {
      const cleaned = normalizeSegment(value);
      return !isStreet(cleaned) ? cleaned : '';
    }

    for (const part of [...parts].reverse()) {
      if (!part || part.length < 2) continue;
      if (/italia/i.test(part)) continue;
      if (isStreet(part)) continue;
      return part;
    }

    return '';
  };

  if (components) {
    if (components.city) {
      return components.city;
    }

    if (Array.isArray(components)) {
      const priorityTypes = [
        'locality',
        'postal_town',
        'administrative_area_level_3',
        'administrative_area_level_2',
        'administrative_area_level_1',
        'sublocality'
      ];

      for (const type of priorityTypes) {
        const componentCandidate = components.find(component => component?.types?.includes(type));
        if (componentCandidate) {
          const candidate = componentCandidate.long_name || componentCandidate.short_name;
          if (candidate) {
            return candidate;
          }
        }
      }
    }

    if (typeof components === 'object') {
      const fallbackKeys = [
        'town',
        'municipality',
        'district',
        'administrative_area_level_3',
        'administrative_area_level_2',
        'administrative_area_level_1',
        'sublocality'
      ];

      for (const key of fallbackKeys) {
        if (components[key]) {
          return components[key];
        }
      }
    }
  }

  const formattedCandidate = formatted ? pickSegment(formatted) : '';
  if (formattedCandidate) {
    if (formatted) {
      const match = formatted.match(/\b\d{5}\s+([A-Za-zÀ-ÿ' ]+?)(?:\s+[A-Z]{2})?(?:,|$)/);
      if (match && match[1]) {
        const extracted = normalizeSegment(match[1]);
        if (extracted) {
          return extracted;
        }
      }
    }
    if (!isStreet(formattedCandidate)) {
      return formattedCandidate;
    }
  }

  const fallbackCandidate = fallback ? pickSegment(fallback) : '';
  if (fallbackCandidate) {
    return fallbackCandidate;
  }

  return '';
};
