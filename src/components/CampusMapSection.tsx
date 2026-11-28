import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  APILoadingStatus,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Car,
  Clock,
  ExternalLink,
  Footprints,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Phone,
  RotateCcw,
  Route,
  Search,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  buildCampusSearchQueries,
  buildExternalGoogleMapsUrl,
  formatRouteDistanceBn,
  formatRouteDurationBn,
  isMapsQuotaError,
  type LatLngPoint,
} from '../utils/mapsUtils';

const MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '';

// Generic national overview before live Places API search resolves the campus address.
const INITIAL_VIEWPORT_CENTER: LatLngPoint = { lat: 23.8, lng: 90.4 };
const INITIAL_VIEWPORT_ZOOM = 7;

type TravelModeOption = 'DRIVING' | 'WALKING';

interface OriginSelection {
  label: string;
  location: LatLngPoint;
}

interface CampusPlaceState {
  location: LatLngPoint;
  displayName: string;
  formattedAddress: string;
}

interface RouteSummaryState {
  distanceMeters: number;
  durationMillis: number;
}

function dispatchQuotaExceeded(): void {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
}

interface OriginAutocompleteProps {
  selectedOrigin: OriginSelection | null;
  onSelectOrigin: (origin: OriginSelection | null) => void;
  onUseCurrentLocation: () => void;
  locatingUser: boolean;
}

function OriginAutocompleteInput({
  selectedOrigin,
  onSelectOrigin,
  onUseCurrentLocation,
  locatingUser,
}: OriginAutocompleteProps) {
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const [inputValue, setInputValue] = useState(selectedOrigin?.label ?? '');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(selectedOrigin?.label ?? '');
  }, [selectedOrigin]);

  const resetSession = useCallback(() => {
    sessionTokenRef.current = null;
    setSuggestions([]);
    setDropdownOpen(false);
  }, []);

  useEffect(() => {
    if (!placesLib) return;
    const trimmed = inputValue.trim();

    if (!trimmed || (selectedOrigin && trimmed === selectedOrigin.label)) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchError(null);
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
        const response = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: trimmed,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ['bd'],
        });
        if (cancelled) return;
        const list = response?.suggestions ?? [];
        setSuggestions(list);
        setDropdownOpen(list.length > 0);
      } catch (err) {
        if (cancelled) return;
        if (isMapsQuotaError(err)) {
          dispatchQuotaExceeded();
        }
        setSuggestions([]);
        setDropdownOpen(false);
        setSearchError('এলাকা খুঁজতে সাময়িক সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [placesLib, inputValue, selectedOrigin]);

  const handleSelectSuggestion = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!placesLib || !suggestion.placePrediction) return;
    try {
      setSearchError(null);
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location'],
      });
      const loc = place.location;
      if (loc) {
        const label =
          place.displayName ||
          place.formattedAddress ||
          suggestion.placePrediction.text.text ||
          'নির্বাচিত স্থান';
        onSelectOrigin({
          label,
          location: { lat: loc.lat(), lng: loc.lng() },
        });
        setInputValue(label);
      }
      resetSession();
    } catch (err) {
      if (isMapsQuotaError(err)) {
        dispatchQuotaExceeded();
      }
      setSearchError('নির্বাচিত স্থানের অবস্থান লোড করা যায়নি।');
    }
  };

  return (
    <div className="space-y-2.5">
      <label htmlFor="campus-origin-input" className="block text-xs font-semibold text-[#57534E]">
        আপনার শুরুর স্থান (এলাকা বা বাজারের নাম লিখুন)
      </label>
      <div className="relative">
        <Search className="w-4 h-4 text-[#78716C] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="campus-origin-input"
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (selectedOrigin && e.target.value !== selectedOrigin.label) {
              onSelectOrigin(null);
            }
          }}
          onFocus={() => {
            if (suggestions.length > 0) setDropdownOpen(true);
          }}
          placeholder="যেমন: মদন বাজার, নেত্রকোণা সদর, মোহনগঞ্জ..."
          autoComplete="off"
          className="w-full pl-10 pr-9 py-2.5 text-sm bg-[#FAF8F5] border border-[#D6CFC5] rounded-xl text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:border-[#7A0D14] focus:bg-white transition-colors"
        />
        {isSearching ? (
          <Loader2 className="w-4 h-4 text-[#7A0D14] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
        ) : inputValue ? (
          <button
            type="button"
            onClick={() => {
              setInputValue('');
              onSelectOrigin(null);
              resetSession();
            }}
            aria-label="অনুসন্ধান মুছুন"
            className="p-1 text-[#78716C] hover:text-[#1C1917] absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}

        {dropdownOpen && suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-[#E7E2DA] rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-[#F0EBE3]"
          >
            {suggestions.map((item, idx) => {
              const prediction = item.placePrediction;
              if (!prediction) return null;
              return (
                <li key={prediction.placeId || idx}>
                  <button
                    type="button"
                    onClick={() => void handleSelectSuggestion(item)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-[#FAF8F5] transition-colors flex items-start gap-2.5 cursor-pointer"
                  >
                    <MapPin className="w-4 h-4 text-[#7A0D14] shrink-0 mt-0.5" />
                    <span className="text-sm text-[#1C1917] leading-snug">
                      {prediction.text.text}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {searchError && <p className="text-xs text-[#991B1B]">{searchError}</p>}

      <button
        type="button"
        onClick={onUseCurrentLocation}
        disabled={locatingUser}
        className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#7A0D14] bg-[#FAF8F5] border border-[#E7E2DA] hover:border-[#7A0D14] hover:bg-white rounded-xl transition-colors cursor-pointer disabled:opacity-60"
      >
        {locatingUser ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LocateFixed className="w-4 h-4" />
        )}
        <span>{locatingUser ? 'অবস্থান নির্ণয় করা হচ্ছে...' : 'আমার বর্তমান অবস্থান ব্যবহার করুন'}</span>
      </button>
    </div>
  );
}

interface MapInnerProps {
  campusName: string;
  contactAddress: string;
  contactPhone: string;
  origin: OriginSelection | null;
  travelMode: TravelModeOption;
  campusPlace: CampusPlaceState | null;
  onCampusResolved: (place: CampusPlaceState | null) => void;
  onCampusError: (message: string | null) => void;
  onRouteSummaryChange: (summary: RouteSummaryState | null) => void;
  onRouteLoadingChange: (loading: boolean) => void;
  onRouteErrorChange: (message: string | null) => void;
  recenterTrigger: number;
}

function CampusMapCanvas({
  campusName,
  contactAddress,
  contactPhone,
  origin,
  travelMode,
  campusPlace,
  onCampusResolved,
  onCampusError,
  onRouteSummaryChange,
  onRouteLoadingChange,
  onRouteErrorChange,
  recenterTrigger,
}: MapInnerProps) {
  const map = useMap('usp-campus-map');
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');
  useMapsLibrary('marker');

  const [campusMarkerRef, campusMarker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(true);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // Close InfoWindow while displaying a route so the polyline and mobile viewport stay unobstructed.
  useEffect(() => {
    if (origin) {
      setInfoOpen(false);
    }
  }, [origin]);

  // 1. Live resolve campus coordinates via Places API (New) SearchByText — zero hardcoded coordinates.
  useEffect(() => {
    if (!placesLib) return;
    let cancelled = false;

    const resolveCampus = async () => {
      const queries = buildCampusSearchQueries(contactAddress);
      onCampusError(null);

      for (const query of queries) {
        try {
          const result = await placesLib.Place.searchByText({
            textQuery: query,
            fields: ['displayName', 'formattedAddress', 'location', 'id'],
          });
          if (cancelled) return;

          const matched = result?.places?.[0];
          const loc = matched?.location;
          if (matched && loc) {
            onCampusResolved({
              location: { lat: loc.lat(), lng: loc.lng() },
              displayName: matched.displayName || campusName,
              formattedAddress: matched.formattedAddress || contactAddress,
            });
            return;
          }
        } catch (err) {
          if (cancelled) return;
          if (isMapsQuotaError(err)) {
            dispatchQuotaExceeded();
            onCampusError('Google Maps কোটা সীমা পূর্ণ হয়েছে।');
            return;
          }
        }
      }

      if (!cancelled) {
        onCampusError('মানচিত্রে ঠিকানাটি স্বয়ংক্রিয়ভাবে পাওয়া যায়নি। নিচের লিংকে Google Maps-এ দেখুন।');
      }
    };

    void resolveCampus();
    return () => {
      cancelled = true;
    };
  }, [placesLib, contactAddress, campusName, onCampusResolved, onCampusError]);

  // 2. Center & zoom to the live-resolved campus marker when found or when user clicks recenter.
  useEffect(() => {
    if (!map || !campusPlace) return;
    if (origin && recenterTrigger === 0) return;
    map.panTo(campusPlace.location);
    map.setZoom(15);
  }, [map, campusPlace, origin, recenterTrigger]);

  // 3. Compute & render route using the modern Routes JS SDK wrapper (Route.computeRoutes).
  useEffect(() => {
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    if (!routesLib || !map || !origin || !campusPlace) {
      onRouteSummaryChange(null);
      onRouteErrorChange(null);
      onRouteLoadingChange(false);
      return;
    }

    let cancelled = false;
    onRouteLoadingChange(true);
    onRouteErrorChange(null);

    const request = {
      origin: origin.location,
      destination: campusPlace.location,
      travelMode,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
    };

    (routesLib.Route as any)
      .computeRoutes(request)
      .then(({ routes }: { routes?: any[] }) => {
        if (cancelled) return;
        onRouteLoadingChange(false);

        const primaryRoute = routes?.[0];
        if (!primaryRoute) {
          onRouteSummaryChange(null);
          onRouteErrorChange('এই মাধ্যমের জন্য কোনো সরাসরি পথ পাওয়া যায়নি। অন্য মাধ্যম চেষ্টা করুন।');
          return;
        }

        const newPolylines: google.maps.Polyline[] = primaryRoute.createPolylines();
        newPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: '#7A0D14',
            strokeWeight: 5,
            strokeOpacity: 0.9,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport, 56);
        }

        onRouteSummaryChange({
          distanceMeters: primaryRoute.distanceMeters ?? 0,
          durationMillis: primaryRoute.durationMillis ?? 0,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        onRouteLoadingChange(false);
        onRouteSummaryChange(null);
        if (isMapsQuotaError(err)) {
          dispatchQuotaExceeded();
          onRouteErrorChange('Google Maps কোটা সীমা পূর্ণ হয়েছে।');
          return;
        }
        onRouteErrorChange('পথ নির্ণয়ে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [
    routesLib,
    map,
    origin,
    campusPlace,
    travelMode,
    onRouteSummaryChange,
    onRouteLoadingChange,
    onRouteErrorChange,
  ]);

  const externalCampusUrl = buildExternalGoogleMapsUrl(
    campusPlace?.location ?? contactAddress,
    origin?.location ?? null,
  );

  return (
    <>
      {campusPlace && (
        <AdvancedMarker
          ref={campusMarkerRef}
          position={campusPlace.location}
          title={campusName}
          onClick={() => setInfoOpen((prev) => !prev)}
        >
          <Pin background="#7A0D14" borderColor="#5E090F" glyphColor="#FFFFFF" />
        </AdvancedMarker>
      )}

      {campusPlace && infoOpen && campusMarker && (
        <InfoWindow
          anchor={campusMarker}
          maxWidth={240}
          headerContent={
            <span className="text-sm font-bold text-[#7A0D14] leading-snug pr-2">
              {campusName}
            </span>
          }
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="space-y-1.5 text-[#1C1917] pt-0.5">
            <p className="text-xs text-[#57534E] leading-relaxed">{contactAddress}</p>
            {contactPhone && (
              <p className="text-xs text-[#1C1917] font-medium flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#7A0D14] shrink-0" />
                <span>{contactPhone}</span>
              </p>
            )}
            <a
              href={externalCampusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#7A0D14] hover:underline pt-0.5"
            >
              <span>Google Maps-এ খুলুন</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </InfoWindow>
      )}

      {origin && (
        <AdvancedMarker position={origin.location} title={origin.label}>
          <Pin background="#B8862B" borderColor="#8A631E" glyphColor="#FFFFFF" />
        </AdvancedMarker>
      )}
    </>
  );
}

function InteractiveMapExperience() {
  const { siteSettings } = useApp();
  const apiStatus = useApiLoadingStatus();

  const [campusPlace, setCampusPlace] = useState<CampusPlaceState | null>(null);
  const [campusError, setCampusError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<OriginSelection | null>(null);
  const [travelMode, setTravelMode] = useState<TravelModeOption>('DRIVING');
  const [routeSummary, setRouteSummary] = useState<RouteSummaryState | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const handleUseCurrentLocation = useCallback(() => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('আপনার ব্রাউজার বর্তমান অবস্থান নির্ণয় সমর্থন করে না।');
      return;
    }

    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocatingUser(false);
        setOrigin({
          label: 'আমার বর্তমান অবস্থান',
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
      },
      (err) => {
        setLocatingUser(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('অবস্থানের অনুমতি বাতিল করা হয়েছে। অনুগ্রহ করে এলাকার নাম লিখে খুঁজুন।');
        } else {
          setGeoError('বর্তমান অবস্থান পাওয়া যায়নি। অনুগ্রহ করে এলাকার নাম লিখে খুঁজুন।');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  const externalDirectionsUrl = buildExternalGoogleMapsUrl(
    campusPlace?.location ?? siteSettings.contactAddress,
    origin?.location ?? null,
  );

  const isApiFailed =
    apiStatus === APILoadingStatus.FAILED || apiStatus === APILoadingStatus.AUTH_FAILURE;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Control & Campus Info Panel */}
      <div className="lg:col-span-4 bg-white border border-[#E7E2DA] rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5">
        <div className="space-y-5">
          {/* Campus Address Card */}
          <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E7E2DA] space-y-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#7A0D14] shrink-0 mt-1" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#B8862B]">ক্যাম্পাসের ঠিকানা</p>
                <p className="text-sm font-semibold text-[#1C1917] leading-relaxed mt-0.5">
                  {siteSettings.contactAddress}
                </p>
              </div>
            </div>
            {siteSettings.contactPhone && (
              <div className="flex items-center gap-2.5 pt-1 text-xs text-[#57534E]">
                <Phone className="w-3.5 h-3.5 text-[#7A0D14] shrink-0" />
                <span>যোগাযোগ: {siteSettings.contactPhone}</span>
              </div>
            )}
          </div>

          {/* Origin Autocomplete & Geolocation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#1C1917] flex items-center gap-1.5">
                <Route className="w-4 h-4 text-[#7A0D14]" />
                <span>ক্যাম্পাসে আসার পথ ও দূরত্ব</span>
              </h3>
              {origin && (
                <button
                  type="button"
                  onClick={() => {
                    setOrigin(null);
                    setRouteSummary(null);
                    setRouteError(null);
                    setRecenterTrigger((n) => n + 1);
                  }}
                  className="text-xs font-semibold text-[#7A0D14] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>মুছুন</span>
                </button>
              )}
            </div>

            <OriginAutocompleteInput
              selectedOrigin={origin}
              onSelectOrigin={(nextOrigin) => {
                setGeoError(null);
                setOrigin(nextOrigin);
              }}
              onUseCurrentLocation={handleUseCurrentLocation}
              locatingUser={locatingUser}
            />

            {geoError && <p className="text-xs text-[#991B1B] leading-relaxed">{geoError}</p>}

            {/* Travel Mode Switch */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTravelMode('DRIVING')}
                className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  travelMode === 'DRIVING'
                    ? 'bg-[#7A0D14] text-white border-[#7A0D14]'
                    : 'bg-[#FAF8F5] text-[#57534E] border-[#E7E2DA] hover:border-[#7A0D14] hover:text-[#7A0D14]'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>গাড়ি / রিকশা</span>
              </button>
              <button
                type="button"
                onClick={() => setTravelMode('WALKING')}
                className={`inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  travelMode === 'WALKING'
                    ? 'bg-[#7A0D14] text-white border-[#7A0D14]'
                    : 'bg-[#FAF8F5] text-[#57534E] border-[#E7E2DA] hover:border-[#7A0D14] hover:text-[#7A0D14]'
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>হেঁটে</span>
              </button>
            </div>
          </div>

          {/* Route Summary Box */}
          {routeLoading && (
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E7E2DA] flex items-center gap-2.5 text-xs text-[#57534E]">
              <Loader2 className="w-4 h-4 text-[#7A0D14] animate-spin shrink-0" />
              <span>সবচেয়ে সুবিধাজনক পথ হিসাব করা হচ্ছে...</span>
            </div>
          )}

          {routeError && (
            <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#991B1B] leading-relaxed">
              {routeError}
            </div>
          )}

          {routeSummary && !routeLoading && (
            <div className="p-4 rounded-xl bg-[#FDF9F1] border border-[#E6D3AA] space-y-2.5">
              <p className="text-xs font-semibold text-[#8A631E]">আনুমানিক দূরত্ব ও সময়</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-2.5 border border-[#EFE3C6]">
                  <p className="text-[11px] text-[#78716C] flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-[#7A0D14]" />
                    <span>দূরত্ব</span>
                  </p>
                  <p className="text-base font-bold text-[#1C1917] mt-0.5 tabular-nums">
                    {formatRouteDistanceBn(routeSummary.distanceMeters)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-2.5 border border-[#EFE3C6]">
                  <p className="text-[11px] text-[#78716C] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#7A0D14]" />
                    <span>সময়</span>
                  </p>
                  <p className="text-base font-bold text-[#1C1917] mt-0.5 tabular-nums">
                    {formatRouteDurationBn(routeSummary.durationMillis)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {campusError && !isApiFailed && (
            <p className="text-xs text-[#78716C] leading-relaxed">{campusError}</p>
          )}
        </div>

        {/* Bottom Direct Google Maps Action */}
        <div className="pt-3 border-t border-[#F0EBE3] flex flex-wrap items-center gap-2.5">
          <a
            href={externalDirectionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] transition-colors whitespace-nowrap"
          >
            <Navigation className="w-4 h-4" />
            <span>{origin ? 'Google Maps-এ পথ দেখুন' : 'Google Maps-এ খুলুন'}</span>
          </a>
          {campusPlace && (
            <button
              type="button"
              onClick={() => setRecenterTrigger((n) => n + 1)}
              className="px-3.5 py-2.5 text-xs font-semibold text-[#1C1917] bg-[#FAF8F5] border border-[#E7E2DA] rounded-xl hover:border-[#7A0D14] hover:text-[#7A0D14] transition-colors cursor-pointer whitespace-nowrap"
            >
              ক্যাম্পাস দেখুন
            </button>
          )}
        </div>
      </div>

      {/* Right Interactive Google Map Canvas */}
      <div className="lg:col-span-8 flex flex-col gap-2">
        <div className="relative w-full h-[380px] sm:h-[460px] lg:flex-1 lg:min-h-[480px] rounded-2xl overflow-hidden border border-[#E7E2DA] bg-[#F4F0E8] shadow-sm">
          {isApiFailed ? (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3">
              <MapPin className="w-8 h-8 text-[#7A0D14]" />
              <p className="text-base font-bold text-[#1C1917]">
                মানচিত্রটি এই মুহূর্তে লোড করা যায়নি
              </p>
              <p className="text-sm text-[#57534E] max-w-md">
                ক্যাম্পাসের ঠিকানা: {siteSettings.contactAddress}
              </p>
              <a
                href={externalDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] transition-colors"
              >
                <span>Google Maps-এ সরাসরি দেখুন</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <GoogleMap
              id="usp-campus-map"
              mapId="DEMO_MAP_ID"
              defaultCenter={INITIAL_VIEWPORT_CENTER}
              defaultZoom={INITIAL_VIEWPORT_ZOOM}
              gestureHandling="cooperative"
              streetViewControl={false}
              mapTypeControl={true}
              fullscreenControl={true}
              style={{ width: '100%', height: '100%' }}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            >
              <CampusMapCanvas
                campusName={siteSettings.siteName}
                contactAddress={siteSettings.contactAddress}
                contactPhone={siteSettings.contactPhone}
                origin={origin}
                travelMode={travelMode}
                campusPlace={campusPlace}
                onCampusResolved={setCampusPlace}
                onCampusError={setCampusError}
                onRouteSummaryChange={setRouteSummary}
                onRouteLoadingChange={setRouteLoading}
                onRouteErrorChange={setRouteError}
                recenterTrigger={recenterTrigger}
              />
            </GoogleMap>
          )}
        </div>
        <p className="text-[11px] text-[#78716C] px-1">
          মানচিত্র ও দিকনির্দেশনা সেবা Google Maps Platform দ্বারা পরিচালিত। আপনার বর্তমান অবস্থান
          কেবল আপনার অনুমতিক্রমে দিকনির্দেশনা দেখাতে ব্যবহৃত হয়।
        </p>
      </div>
    </div>
  );
}

export function CampusMapSection() {
  const { siteSettings } = useApp();
  const fallbackUrl = buildExternalGoogleMapsUrl(siteSettings.contactAddress);

  return (
    <section
      id="campus-location-map"
      aria-labelledby="campus-map-heading"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-[#B8862B]">ক্যাম্পাস লোকেশন ও দিকনির্দেশনা</p>
          <h2 id="campus-map-heading" className="text-2xl sm:text-3xl font-bold text-[#1C1917]">
            মানচিত্রে আমাদের অবস্থান দেখুন
          </h2>
        </div>
        <p className="text-sm text-[#57534E] max-w-md">
          আপনার এলাকা অথবা বর্তমান অবস্থান থেকে {siteSettings.siteName} ক্যাম্পাসে আসার পথ ও দূরত্ব
          তাৎক্ষণিকভাবে জানুন।
        </p>
      </div>

      {MAPS_API_KEY ? (
        <APIProvider apiKey={MAPS_API_KEY} language="bn" region="BD">
          <InteractiveMapExperience />
        </APIProvider>
      ) : (
        <div className="bg-white border border-[#E7E2DA] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-base font-bold text-[#1C1917] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#7A0D14]" />
              <span>{siteSettings.contactAddress}</span>
            </p>
            <p className="text-sm text-[#57534E]">
              ইন্টারেক্টিভ মানচিত্র চালু করতে Google Maps API key সেট করুন অথবা নিচের বাটন থেকে
              Google Maps-এ সরাসরি অবস্থান দেখুন।
            </p>
          </div>
          <a
            href={fallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#7A0D14] text-white text-sm font-semibold rounded-xl hover:bg-[#5E090F] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Google Maps-এ দেখুন</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}
    </section>
  );
}
