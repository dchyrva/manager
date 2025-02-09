import * as React from 'react';

import { RegionSelect } from 'src/components/RegionSelect/RegionSelect';
import { useRegionsQuery } from 'src/queries/regions/regions';

import type { Dashboard, FilterValue } from '@linode/api-v4';

export interface CloudPulseRegionSelectProps {
  defaultValue?: FilterValue;
  handleRegionChange: (
    region: string | undefined,
    labels: string[],
    savePref?: boolean
  ) => void;
  label: string;
  placeholder?: string;
  savePreferences?: boolean;
  selectedDashboard: Dashboard | undefined;
}

export const CloudPulseRegionSelect = React.memo(
  (props: CloudPulseRegionSelectProps) => {
    const { data: regions, isError, isLoading } = useRegionsQuery();

    const {
      defaultValue,
      handleRegionChange,
      label,
      placeholder,
      savePreferences,
      selectedDashboard,
    } = props;

    const [selectedRegion, setSelectedRegion] = React.useState<string>();
    // Once the data is loaded, set the state variable with value stored in preferences
    React.useEffect(() => {
      if (regions && savePreferences) {
        const region = defaultValue
          ? regions.find((regionObj) => regionObj.id === defaultValue)
          : undefined;
        handleRegionChange(region?.id, region ? [region.label] : []);
        setSelectedRegion(region?.id);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [regions]);

    return (
      <RegionSelect
        onChange={(_, region) => {
          setSelectedRegion(region?.id);
          handleRegionChange(
            region?.id,
            region ? [region.label] : [],
            savePreferences
          );
        }}
        currentCapability={undefined}
        data-testid="region-select"
        disableClearable={false}
        disabled={!selectedDashboard || !regions}
        errorText={isError ? `Failed to fetch ${label || 'Regions'}.` : ''}
        fullWidth
        label={label || 'Region'}
        loading={isLoading}
        noMarginTop
        placeholder={placeholder ?? 'Select a Region'}
        regions={regions ? regions : []}
        value={selectedRegion}
      />
    );
  },
  (prevProps, nextProps) =>
    prevProps.selectedDashboard?.id === nextProps.selectedDashboard?.id
);
