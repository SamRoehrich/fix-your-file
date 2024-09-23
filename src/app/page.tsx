"use client";
import { unfuckPowerData } from "./action";
import { useState } from "react";

export default function Home() {
  const [power, setPower] = useState<number>();
  const [baseline, setBaseline] = useState<number>();

  const action = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = new FormData(event.target as HTMLFormElement);

    const startTime = parseInt(form.get("startTime") as string, 10);
    const endTime = parseInt(form.get("endTime") as string, 10);

    const res = await unfuckPowerData(
      form,
      isNaN(startTime) ? null : startTime,
      isNaN(endTime) ? null : endTime,
    );
    if (res) {
      setPower(res);
    }
  };

  return (
    <div>
      <h1> Unf*ck your power data. </h1>
      <form
        onSubmit={action}
        className="flex flex-col space-x-4 w-full items-center"
      >
        <input type="file" accept=".gpx" name="file" />
        <div className="mt-4 space-y-4 mb-4 flex flex-col items-center">
          <label htmlFor="baseline">
            Baseline: Only power numbers above this wattage will be used to
            determine your average.
          </label>
          <input
            className="rounded-2xl border-2 border-gray-300 shadow-lg p-4"
            type="number"
            name="baseline"
            placeholder="Baseline"
            onChange={(e) => setBaseline(parseInt(e.target.value, 10))}
          />
        </div>
        <button type="submit">Unf*ck your file </button>
      </form>
      <p>
        Your average power with {baseline || 0} removed is: {power}
      </p>
    </div>
  );
}
