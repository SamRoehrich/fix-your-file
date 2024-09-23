import { Parser } from "xml2js";
import moment, { Moment } from "moment";
import { promisify } from "util";

const parser = new Parser();
const parseStringAsync = promisify(parser.parseString).bind(parser);

interface PowerDataPoint {
  time: Date;
  power: number;
}

async function extractPowerFromGpx(
  form: FormData,
  startTimeMinutes: number | null = null,
  endTimeMinutes: number | null = null,
) {
  const gpxFile = form.get("file") as File;

  try {
    const data = await gpxFile.text();
    //@ts-expect-error can't type
    const result = await parseStringAsync(data);

    const powerData: PowerDataPoint[] = [];
    let startTime: Moment | null = null;

    //@ts-expect-error won't type
    const tracks = result.gpx.trk || [];
    for (const track of tracks) {
      const segments = track.trkseg || [];
      for (const segment of segments) {
        const points = segment.trkpt || [];
        for (const point of points) {
          const time: Moment | null = point.time ? moment(point.time[0]) : null;
          let power = null;

          if (point.extensions) {
            for (const extension of point.extensions) {
              const powerDataXml = extension["power"];
              if (powerDataXml && powerDataXml[0]) {
                power = parseInt(powerDataXml[0], 10);
                if (isNaN(power)) {
                  console.warn(`Invalid power value: ${powerDataXml[0]}`);
                  power = null;
                }
              }
            }
          }

          if (power !== null && time !== null) {
            if (startTime === null) {
              startTime = time;
            }

            const duration = moment.duration(time.diff(startTime));
            const minutesElapsed = duration.asMinutes();

            if (
              (startTimeMinutes === null ||
                minutesElapsed >= startTimeMinutes) &&
              (endTimeMinutes === null || minutesElapsed <= endTimeMinutes)
            ) {
              powerData.push({ time: time.toDate(), power });
            }
          }
        }
      }
    }

    return powerData;
  } catch (error) {
    console.error("Error parsing GPX file:", error);
    return [];
  }
}

async function calculateAveragePower(
  gpxFile: FormData,
  startTimeMinutes: number | null = null,
  endTimeMinutes: number | null = null,
) {
  const powerData = await extractPowerFromGpx(
    gpxFile,
    startTimeMinutes,
    endTimeMinutes,
  );

  const filteredPower = powerData
    .map(({ power }) => power)
    .filter((power) => power >= 0);

  if (filteredPower.length === 0) {
    return null;
  }

  const averagePower =
    filteredPower.reduce((sum, p) => sum + p, 0) / filteredPower.length;
  return averagePower;
}

export const unfuckPowerData = async (
  gpxFile: FormData,
  startTimeMinutes: number | null = null,
  endTimeMinutes: number | null = null,
) => {
  const avgPower = await calculateAveragePower(
    gpxFile,
    startTimeMinutes,
    endTimeMinutes,
  );

  if (avgPower !== null) {
    console.log(
      `Average Power for the specified range: ${avgPower.toFixed(2)} watts`,
    );
    return avgPower;
  } else {
    console.log("No valid power data found in the specified range.");
  }
};
