import { LineSegment, VictoryAxis, VictoryChart, VictoryLabel } from 'victory';

const axis = {
  stroke: 'none'
}

const fontStyles = {
  fill: '#ffffff',
  fontSize: 10,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 500
}

const tickLabels = {
  ...fontStyles,
  opacity: 0.3
}

const axisLabel = {
  ...fontStyles,
  padding: 20
}

const theme = {
  dependentAxis: {
    style: {
      axis,
      axisLabel,
      grid: {
        stroke: 'none'
      },
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
  }
}

function Chart({ xAxis, yAxis, children, ...rest }) {
  return (
    <VictoryChart theme={theme} { ...rest }>
      <VictoryAxis
        independentAxis
        gridComponent={<LineSegment y2={10} />}
        { ...xAxis }
      />

      <VictoryAxis
        dependentAxis
        tickLabelComponent={<VictoryLabel dy={-5} verticalAnchor={"end"} />}
        { ...yAxis }
      />

      {children}
    </VictoryChart>
  );
}

export default Chart;
