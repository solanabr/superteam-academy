'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

// Type definition for Google Maps Autocomplete
type GoogleAutocomplete = any;

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Enter location',
  className,
  id,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Script is already loading or loaded
        const checkLoaded = setInterval(() => {
          if ((window as any).google?.maps?.places) {
            setIsLoaded(true);
            clearInterval(checkLoaded);
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      if (!apiKey) {
        console.warn('Google Maps API key not found. Location autocomplete will not work.');
        return;
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    try {
      const google = (window as any).google;

      // Initialize autocomplete
      autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
        types: ['(cities)'],
        fields: ['formatted_address', 'address_components', 'geometry'],
      });

      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.formatted_address) {
          onChange(place.formatted_address);
        }
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }

    return () => {
      if (autocompleteRef.current) {
        const google = (window as any).google;
        google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onChange]);

  return (
    <Input
      ref={inputRef}
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(className)}
      autoComplete="off"
    />
  );
}
