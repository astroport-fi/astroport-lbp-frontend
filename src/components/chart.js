import { LineSegment, VictoryAxis, VictoryChart, VictoryLabel } from 'victory';

const axis = {
  stroke: 'none'
}

const tickLabels = {
  fill: '#ffffff',
  fontSize: 12
}

const axisLabel = {
  fontSize: 12,
  fill: '#ffffff',
  padding: 20
}

const theme = {
  dependentAxis: {
    style: {
      grid: {
        stroke: '#ffffff',
        opacity: 0.2
      },
      axis,
      axisLabel,
      tickLabels: {
        ...tickLabels,
        textAnchor: 'start'
      }
    },
    offsetX: 0
  },
  independentAxis: {
    style: {
      grid: {
        stroke: '#ffffff',
        strokeDasharray: '4, 6',
        opacity: 0.2
      },
      axis,
      axisLabel,
      tickLabels,
    },
    offsetY: 30
  },
  line: {
    style: {
      data: {
        strokeWidth: 2
      }
    }
  }
}

function Chart({ xAxis, yAxis, children }) {
  return (
    <VictoryChart theme={theme} domainPadding={10} padding={{ top: 30, left: 45, right: 0, bottom: 40 }}>
      <VictoryAxis
        independentAxis
        { ...xAxis }
      />

      <VictoryAxis
        dependentAxis
        tickLabelComponent={<VictoryLabel dy={-5} verticalAnchor={"end"} />}
        gridComponent={<LineSegment x1={0} />}
        { ...yAxis }
      />

      {children}
    </VictoryChart>
  );
}

export default Chart;
