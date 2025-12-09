import {
  Clock,
  MapPin,
  Utensils,
  Building,
  TreePine,
  Palette,
  Camera,
  Landmark,
  Dumbbell,
  Waves,
  Compass,
  ShoppingBag,
  Music,
  Plane,
  Gift,
  Coffee,
  Footprints,
  LucideIcon,
} from 'lucide-react';

export type ActivityType = 'arrival' | 'meal' | 'landmark' | 'museum' | 'nature' | 'art' | 'photo' | 'sport' | 'water' | 'shopping' | 'entertainment' | 'general';

export function detectActivityType(activityName: string, description: string): ActivityType {
  const combined = (activityName + ' ' + description).toLowerCase();

  if (
    combined.includes('arrive') ||
    combined.includes('check-in') ||
    combined.includes('checkin') ||
    combined.includes('departure') ||
    combined.includes('airport') ||
    combined.includes('station')
  ) {
    return 'arrival';
  }

  if (
    combined.includes('lunch') ||
    combined.includes('dinner') ||
    combined.includes('breakfast') ||
    combined.includes('brunch') ||
    combined.includes('meal') ||
    combined.includes('restaurant') ||
    combined.includes('café') ||
    combined.includes('cafe') ||
    combined.includes('eat') ||
    combined.includes('food')
  ) {
    return 'meal';
  }

  if (
    combined.includes('museum') ||
    combined.includes('gallery') ||
    combined.includes('exhibition') ||
    combined.includes('art institute') ||
    combined.includes('MoMA') ||
    combined.includes('louvre')
  ) {
    return 'museum';
  }

  if (
    combined.includes('park') ||
    combined.includes('forest') ||
    combined.includes('nature') ||
    combined.includes('garden') ||
    combined.includes('green') ||
    combined.includes('hiking')
  ) {
    return 'nature';
  }

  if (
    combined.includes('swimming') ||
    combined.includes('beach') ||
    combined.includes('water') ||
    combined.includes('surf') ||
    combined.includes('diving') ||
    combined.includes('kayak')
  ) {
    return 'water';
  }

  if (
    combined.includes('photo') ||
    combined.includes('photograph') ||
    combined.includes('picture') ||
    combined.includes('cloud gate') ||
    combined.includes('the bean')
  ) {
    return 'photo';
  }

  if (
    combined.includes('art') ||
    combined.includes('paint') ||
    combined.includes('sculpture') ||
    combined.includes('street art') ||
    combined.includes('mural')
  ) {
    return 'art';
  }

  if (
    combined.includes('gym') ||
    combined.includes('yoga') ||
    combined.includes('exercise') ||
    combined.includes('fitness') ||
    combined.includes('sport')
  ) {
    return 'sport';
  }

  if (
    combined.includes('shop') ||
    combined.includes('shopping') ||
    combined.includes('market') ||
    combined.includes('mall')
  ) {
    return 'shopping';
  }

  if (
    combined.includes('concert') ||
    combined.includes('show') ||
    combined.includes('theater') ||
    combined.includes('theatre') ||
    combined.includes('performance') ||
    combined.includes('music')
  ) {
    return 'entertainment';
  }

  return 'general';
}

export function getActivityIcon(type: ActivityType): LucideIcon {
  const icons: Record<ActivityType, LucideIcon> = {
    arrival: Clock,
    meal: Utensils,
    landmark: Landmark,
    museum: Building,
    nature: TreePine,
    art: Palette,
    photo: Camera,
    sport: Dumbbell,
    water: Waves,
    shopping: ShoppingBag,
    entertainment: Music,
    general: MapPin,
  };

  return icons[type] || MapPin;
}

export function getActivityColor(type: ActivityType): string {
  const colors: Record<ActivityType, string> = {
    arrival: 'bg-sky-100 text-sky-600',
    meal: 'bg-orange-100 text-orange-600',
    landmark: 'bg-amber-100 text-amber-600',
    museum: 'bg-purple-100 text-purple-600',
    nature: 'bg-green-100 text-green-600',
    art: 'bg-pink-100 text-pink-600',
    photo: 'bg-blue-100 text-blue-600',
    sport: 'bg-red-100 text-red-600',
    water: 'bg-cyan-100 text-cyan-600',
    shopping: 'bg-fuchsia-100 text-fuchsia-600',
    entertainment: 'bg-indigo-100 text-indigo-600',
    general: 'bg-slate-100 text-slate-600',
  };

  return colors[type];
}

export function isPlaceName(activityName: string): boolean {
  const lowerName = activityName.toLowerCase();

  const mealKeywords = [
    'lunch',
    'dinner',
    'breakfast',
    'brunch',
    'meal',
    'eat',
    'food',
    'restaurant',
    'café',
    'cafe',
  ];

  if (mealKeywords.some((keyword) => lowerName.includes(keyword))) {
    return false;
  }

  const arrivalKeywords = [
    'arrive',
    'check-in',
    'checkin',
    'departure',
    'depart',
  ];

  if (arrivalKeywords.some((keyword) => lowerName.includes(keyword))) {
    return false;
  }

  const placePrefixes = [
    'the ',
    'visit ',
    'explore ',
    'tour ',
    'see ',
    'walk through',
    'stroll',
  ];

  const placeIndicators = [
    'park',
    'museum',
    'gallery',
    'landmark',
    'monument',
    'castle',
    'church',
    'temple',
    'palace',
    'cathedral',
    'institute',
    'center',
    'centre',
    'beach',
    'lake',
    'river',
    'mountain',
    'garden',
    'square',
    'plaza',
    'street',
    'avenue',
    'bridge',
    'pier',
    'fountain',
    'statue',
    'line',
    'market',
    'acropolis',
    'parthenon',
    'colosseum',
  ];

  return (
    placePrefixes.some((prefix) => lowerName.startsWith(prefix)) ||
    placeIndicators.some((indicator) => lowerName.includes(indicator))
  );
}

export interface ActivityIcons {
  icons: LucideIcon[];
  color: string;
}

export function getActivityIcons(activityName: string, description: string): ActivityIcons {
  const lowerName = activityName.toLowerCase();
  const lowerDesc = description.toLowerCase();
  const combined = lowerName + ' ' + lowerDesc;

  if (combined.includes('departure') || combined.includes('depart')) {
    const cityMatch = activityName.match(/to\s+(\w+)/i);
    if (cityMatch) {
      return {
        icons: [Plane, MapPin],
        color: 'bg-sky-100 text-sky-600',
      };
    }
    return {
      icons: [Plane],
      color: 'bg-sky-100 text-sky-600',
    };
  }

  if (combined.includes('museum')) {
    const hasVisit = lowerName.includes('visit') || lowerName.includes('explore') || lowerName.includes('tour');
    if (hasVisit) {
      return {
        icons: [Footprints, Building],
        color: 'bg-purple-100 text-purple-600',
      };
    }
    return {
      icons: [Building],
      color: 'bg-purple-100 text-purple-600',
    };
  }

  if (lowerName.includes('acropolis') || lowerName.includes('parthenon') || lowerName.includes('colosseum') ||
      lowerName.includes('pantheon') || lowerName.includes('temple') || lowerName.includes('ruins')) {
    const hasVisit = lowerName.includes('visit') || lowerName.includes('explore') || lowerName.includes('tour');
    if (hasVisit) {
      return {
        icons: [Footprints, Landmark],
        color: 'bg-amber-100 text-amber-600',
      };
    }
    return {
      icons: [Landmark],
      color: 'bg-amber-100 text-amber-600',
    };
  }

  if (lowerName.includes('lunch') || lowerName.includes('dinner') || lowerName.includes('breakfast')) {
    const hasLocation = lowerName.includes(' at ') || lowerName.includes(' in ') || lowerName.includes(' near ');
    if (hasLocation) {
      const locationPart = lowerName.split(/\s+(?:at|in|near)\s+/)[1];
      if (locationPart) {
        if (locationPart.includes('market')) {
          return {
            icons: [Utensils, ShoppingBag],
            color: 'bg-orange-100 text-orange-600',
          };
        }
        return {
          icons: [Utensils, MapPin],
          color: 'bg-orange-100 text-orange-600',
        };
      }
    }
    return {
      icons: [Utensils],
      color: 'bg-orange-100 text-orange-600',
    };
  }

  if (lowerName.includes('souvenirs') || lowerName.includes('souvenir')) {
    if (lowerName.includes('relax') || lowerName.includes('last minute')) {
      return {
        icons: [Clock, Gift],
        color: 'bg-fuchsia-100 text-fuchsia-600',
      };
    }
    return {
      icons: [Gift],
      color: 'bg-fuchsia-100 text-fuchsia-600',
    };
  }

  if (lowerName.includes('high line')) {
    return {
      icons: [Footprints, TreePine],
      color: 'bg-green-100 text-green-600',
    };
  }

  if (combined.includes('walk') && (combined.includes('park') || combined.includes('garden'))) {
    return {
      icons: [Footprints, TreePine],
      color: 'bg-green-100 text-green-600',
    };
  }

  const activityType = detectActivityType(activityName, description);
  return {
    icons: [getActivityIcon(activityType)],
    color: getActivityColor(activityType),
  };
}
