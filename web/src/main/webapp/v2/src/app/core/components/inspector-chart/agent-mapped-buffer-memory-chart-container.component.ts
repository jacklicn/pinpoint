import { Component, OnInit, OnDestroy, ComponentFactoryResolver, Injector } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment-timezone';

import { Actions } from 'app/shared/store';
import { WebAppSettingDataService, NewUrlStateNotificationService, AnalyticsService, StoreHelperService, DynamicPopupService } from 'app/shared/services';
import { AgentDirectBufferChartDataService } from './agent-direct-buffer-chart-data.service';
import { HELP_VIEWER_LIST } from 'app/core/components/help-viewer-popup/help-viewer-popup-container.component';
import { InspectorChartContainer } from 'app/core/components/inspector-chart/inspector-chart-container';
import { IChartDataFromServer } from 'app/core/components/inspector-chart/chart-data.service';
import { InspectorPageService } from 'app/routes/inspector-page/inspector-page.service';

@Component({
    selector: 'pp-agent-mapped-buffer-memory-chart-container',
    templateUrl: './agent-mapped-buffer-memory-chart-container.component.html',
    styleUrls: ['./agent-mapped-buffer-memory-chart-container.component.css'],
})
export class AgentMappedBufferMemoryChartContainerComponent extends InspectorChartContainer implements OnInit, OnDestroy {
    constructor(
        storeHelperService: StoreHelperService,
        webAppSettingDataService: WebAppSettingDataService,
        newUrlStateNotificationService: NewUrlStateNotificationService,
        chartDataService: AgentDirectBufferChartDataService,
        translateService: TranslateService,
        analyticsService: AnalyticsService,
        dynamicPopupService: DynamicPopupService,
        componentFactoryResolver: ComponentFactoryResolver,
        injector: Injector,
        inspectorPageService: InspectorPageService,
    ) {
        super(
            100,
            storeHelperService,
            webAppSettingDataService,
            newUrlStateNotificationService,
            chartDataService,
            translateService,
            analyticsService,
            dynamicPopupService,
            componentFactoryResolver,
            injector,
            inspectorPageService
        );
    }

    ngOnInit() {
        this.initI18nText();
        this.initHoveredInfo();
        this.initTimezoneAndDateFormat();
        this.initChartData();
    }

    ngOnDestroy() {
        this.unsubscribe.next();
        this.unsubscribe.complete();
    }

    protected makeChartData(data: IChartDataFromServer): {[key: string]: any} {
        return {
            x: data.charts.x.map((time: number) => moment(time).tz(this.timezone).format(this.dateFormat[0]) + '#' + moment(time).tz(this.timezone).format(this.dateFormat[1])),
            mappedMemoryUsed: data.charts.y['MAPPED_MEMORY_USED'].map((arr: number[]) => this.parseData(arr[2])),
        };
    }

    protected makeDataOption(data: {[key: string]: any}): {[key: string]: any} {
        return {
            labels: data.x,
            datasets: [{
                type: 'line',
                label: 'Mapped Buffer Memory',
                data: data.mappedMemoryUsed,
                fill: true,
                borderWidth: 0.5,
                borderColor: 'rgb(31, 119, 180, 0.4)',
                backgroundColor: 'rgb(31, 119, 180, 0.4)',
                pointRadius: 0,
                pointHoverRadius: 3
            }]
        };
    }

    protected makeNormalOption(data: {[key: string]: any}): {[key: string]: any} {
        return {
            responsive: true,
            title: {
                display: false,
                text: 'Mapped Buffer Memory'
            },
            tooltips: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    title: (value: {[key: string]: any}[]): string => {
                        return value[0].xLabel.join(' ');
                    },
                    label: (value: {[key: string]: any}, d: {[key: string]: any}): string => {
                        return `${d.datasets[value.datasetIndex].label}: ${isNaN(value.yLabel) ? `-` : this.convertWithUnit(value.yLabel)}`;
                    }
                }
            },
            hover: {
                mode: 'index',
                intersect: false,
                onHover: (event: MouseEvent, elements: {[key: string]: any}[]): void => {
                    if (!this.isDataEmpty(data)) {
                        this.storeHelperService.dispatch(new Actions.ChangeHoverOnInspectorCharts({
                            index: event.type === 'mouseout' ? -1 : elements[0]._index,
                            offsetX: event.offsetX,
                            offsetY: event.offsetY
                        }));
                    }
                },
            },
            scales: {
                xAxes: [{
                    display: true,
                    scaleLabel: {
                        display: false
                    },
                    gridLines: {
                        color: 'rgb(0, 0, 0)',
                        lineWidth: 0.5,
                        drawBorder: true,
                        drawOnChartArea: false
                    },
                    ticks: {
                        maxTicksLimit: 4,
                        callback: (label: string): string[] => {
                            return label.split('#');
                        },
                        maxRotation: 0,
                        minRotation: 0,
                        fontSize: 11,
                        padding: 5
                    }
                }],
                yAxes: [{
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: 'Memory (bytes)',
                        fontSize: 14,
                        fontStyle: 'bold'
                    },
                    gridLines: {
                        color: 'rgb(0, 0, 0)',
                        lineWidth: 0.5,
                        drawBorder: true,
                        drawOnChartArea: false
                    },
                    ticks: {
                        beginAtZero: true,
                        maxTicksLimit: 5,
                        callback: (label: number): string => {
                            return this.convertWithUnit(label);
                        },
                        min: 0,
                        max: this.isDataEmpty(data) ? this.defaultYMax : undefined,
                        padding: 5
                    }
                }]
            },
            legend: {
                display: true,
                labels: {
                    boxWidth: 30,
                    padding: 10
                }
            }
        };
    }

    private convertWithUnit(value: number): string {
        const unit = ['', 'K', 'M', 'G'];
        let result = value;
        let index = 0;
        while ( result >= 1000 ) {
            index++;
            result /= 1000;
        }

        result = Number.isInteger(result) ? result : Number(result.toFixed(2));
        return result + unit[index];
    }

    onShowHelp($event: MouseEvent): void {
        super.onShowHelp($event, HELP_VIEWER_LIST.AGENT_MAPPED_BUFFER_MEMORY);
    }
}
