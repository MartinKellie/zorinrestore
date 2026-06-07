interface MachineDetailsProps {
  machine: {
    hostname: string | null
    os_name: string | null
    kernel_version: string | null
    architecture: string | null
    scanner_version: string | null
    python_version: string | null
    last_scan_at: string | null
  } | null
}

export function MachineDetails({ machine }: MachineDetailsProps) {
  if (!machine) {
    return (
      <p className="text-sm text-gray-500">
        No scan data yet — run a scan to populate machine details.
      </p>
    )
  }

  const lastScan = machine.last_scan_at
    ? new Date(machine.last_scan_at).toLocaleString()
    : "Never"

  const rows: { label: string; value: string | null }[] = [
    { label: "Hostname", value: machine.hostname },
    { label: "OS", value: machine.os_name },
    { label: "Kernel", value: machine.kernel_version },
    { label: "Architecture", value: machine.architecture },
    { label: "Scanner version", value: machine.scanner_version },
    { label: "Python version", value: machine.python_version },
    { label: "Last scan", value: lastScan },
  ]

  return (
    <dl className="space-y-2">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex gap-4">
          <dt className="w-40 shrink-0 text-sm font-medium text-gray-700">{label}</dt>
          <dd className="text-sm text-gray-900">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  )
}
