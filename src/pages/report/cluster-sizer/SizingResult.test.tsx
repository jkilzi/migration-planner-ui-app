import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { mockClusterRequirementsResponse } from './mocks/clusterRequirementsResponse.mock';
import { DEFAULT_FORM_VALUES } from './constants';
import { SizingResult } from './SizingResult';

import '@testing-library/jest-dom';

const DISCLAIMER_TEXT =
  'Note: Resource requirements are estimates based on current workloads. Please verify this architecture with your SME team to ensure optimal performance.';

afterEach(() => cleanup());

describe('SizingResult', () => {
  it('renders the estimation disclaimer when sizing data is present', () => {
    render(
      <SizingResult
        clusterName="Test Cluster"
        formValues={DEFAULT_FORM_VALUES}
        sizerOutput={mockClusterRequirementsResponse}
      />,
    );

    expect(screen.getByText(DISCLAIMER_TEXT)).toBeInTheDocument();
  });

  it('includes the disclaimer in copied recommendations', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <SizingResult
        clusterName="Test Cluster"
        formValues={DEFAULT_FORM_VALUES}
        sizerOutput={mockClusterRequirementsResponse}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: /copy recommendations/i }),
    );

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining(DISCLAIMER_TEXT),
    );
  });
});
