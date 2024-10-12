export interface BaseChartValueChangeParams<TPayload> {
    eventType: string;
    categoryClicked: string;
    payload: TPayload | null;
  }
  