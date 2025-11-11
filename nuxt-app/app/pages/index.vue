<template>
  <div class="min-h-screen bg-background p-6">
    <div class="mx-auto max-w-4xl">
      <div class="mb-8 text-center">
        <h1 class="text-4xl font-bold text-foreground mb-2">File Converter</h1>
        <p class="text-muted-foreground">
          Upload, configure, and convert your text files
        </p>
      </div>

      <div class="grid gap-6 md:grid-cols-2">
        <!-- Upload & Configuration Card -->
        <Card>
          <CardHeader>
            <CardTitle>Upload & Configure</CardTitle>
            <CardDescription
              >Upload your .txt file and set parameters</CardDescription
            >
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- File Upload -->
            <div class="space-y-2">
              <Label for="file">Upload File</Label>
              <div class="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".txt"
                  class="cursor-pointer"
                  @change="handleFileChange"
                />
                <Upload class="h-5 w-5 text-muted-foreground" />
              </div>
              <div
                v-if="file"
                class="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <FileText class="h-4 w-4" />
                <span>{{ file?.name }}</span>
              </div>
            </div>

            <!-- Year Input -->
            <div class="space-y-2">
              <Label for="year">Year</Label>
              <Input id="year" type="text" placeholder="2025" v-model="year" />
            </div>

            <!-- Month Input -->
            <div class="space-y-2">
              <Label for="month">Month</Label>
              <Select v-model="month">
                <SelectTrigger id="month">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01">01</SelectItem>
                  <SelectItem value="02">02</SelectItem>
                  <SelectItem value="03">03</SelectItem>
                  <SelectItem value="04">04</SelectItem>
                  <SelectItem value="05">05</SelectItem>
                  <SelectItem value="06">06</SelectItem>
                  <SelectItem value="07">07</SelectItem>
                  <SelectItem value="08">08</SelectItem>
                  <SelectItem value="09">09</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="11">11</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Company Code Input -->
            <div class="space-y-2">
              <Label for="companyCode">Company Code</Label>
              <Input
                id="companyCode"
                type="text"
                placeholder="ABC123"
                v-model="companyCode"
              />
            </div>

            <!-- Output Format Selection -->
            <div class="space-y-2">
              <Label for="outputFormat">Output Format</Label>
              <Select v-model="outputFormat">
                <SelectTrigger id="outputFormat">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JACCS">JACCS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button class="w-full" @click="handleConvert">
              Convert File
            </Button>
          </CardContent>
        </Card>

        <!-- Preview & Download Card -->
        <Card>
          <CardHeader>
            <CardTitle>Preview & Download</CardTitle>
            <CardDescription
              >Review and download your converted file</CardDescription
            >
          </CardHeader>
          <CardContent class="space-y-4">
            <template v-if="convertedContent">
              <div class="rounded-md bg-muted p-4 max-h-96 overflow-auto">
                <pre class="text-sm text-foreground whitespace-pre-wrap"
                  >{{ convertedContent }}
                </pre>
              </div>
              <Button class="w-full" @click="handleDownload">
                <Download class="mr-2 h-4 w-4" />
                Download Converted File
              </Button>
            </template>
            <template v-else>
              <div
                class="flex items-center justify-center h-96 border-2 border-dashed border-border rounded-md"
              >
                <p class="text-muted-foreground">No converted file yet</p>
              </div>
            </template>
          </CardContent>
        </Card>
      </div>
    </div>
    <Toaster />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Toaster } from "@/components/ui/sonner";
import "vue-sonner/style.css";

// shadcn-vue components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "vue-sonner";
import Encoding from "encoding-japanese";
import { Upload, Download, FileText } from "lucide-vue-next";

const COMPANY_CODE_KEY = "file-converter:companyCode";
const file = ref<File | null>(null);
const year = ref("2025");
const month = ref("");
const companyCode = ref("");
const outputFormat = ref("JACCS");
const convertedContent = ref<string | null>(null);

onMounted(() => {
  const saved = localStorage.getItem(COMPANY_CODE_KEY);
  if (saved) {
    companyCode.value = saved;
  }
});

watch(companyCode, (val) => {
  if (val) {
    localStorage.setItem(COMPANY_CODE_KEY, val);
  } else {
    localStorage.removeItem(COMPANY_CODE_KEY);
  }
});

const yearMonth = computed(() => {
  if (year.value && month.value) {
    return `${year.value}${month.value}`;
  }
  return "";
});

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const selectedFile = target.files?.[0] || null;
  if (selectedFile && selectedFile.type === "text/plain") {
    file.value = selectedFile;
    convertedContent.value = null;
    toast("File uploaded: " + selectedFile.name);
  } else {
    toast("Invalid file", {
      description: "Please upload a .txt file",
    });
  }
};

const handleConvert = async () => {
  if (!file.value || !year.value || !month.value || !companyCode.value) {
    toast("Missing information", {
      description: "Please fill in all fields and upload a file",
    });
    return;
  }

  const result = await validateJaccs(file.value, month, year);
  if (!result.ok) {
    toast("File format is wrong");
    console.error("Validation errors:", result.errors);
    return;
  }

  try {
    if (outputFormat.value === "JACCS") {
      const converted = await convertJaccs(file.value, month, year);
      convertedContent.value = converted;
      toast("Conversion complete", {
        description: "File has been converted successfully",
      });
    }
  } catch (error) {
    console.error("Conversion error:", error);
    toast("Conversion failed", {
      description: "Error reading or converting the file",
    });
  }
};

const handleDownload = () => {
  if (!convertedContent.value) return;

  // JS string (UTF-16) -> Shift_JIS byte array
  const sjisArray = Encoding.convert(convertedContent.value, {
    to: "SJIS", // or "SHIFT_JIS"
    from: "UNICODE", // normal JS string
    type: "array", // get number[] back
  });

  const uint8 = new Uint8Array(sjisArray);

  const blob = new Blob([uint8], {
    type: "text/plain;charset=shift_jis",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${companyCode.value}_${year.value}_${month.value}_converted.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  toast({
    title: "Download started",
    description: "Your converted file is being downloaded as Shift_JIS",
  });
};

interface JaccsHeader {
  registeredNumber: string;
  date: string;
}

interface JaccsRow {
  bankCode: string;
  storeCode: string;
  detail: [string, string, string];
  fee: string;
  isNewUser: string;
  contractNumber: string;
}

interface JaccsRecord {
  header: JaccsHeader;
  data: JaccsRow;
}

const convertJaccs = async (
  file: File,
  month: Ref<string>,
  year: Ref<string>
): Promise<string> => {
  // 1. read file
  const buf = await file.arrayBuffer();
  const text = new TextDecoder("shift_jis").decode(buf);

  // 2. parse lines
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headerLine = lines[0] ?? "";
  const header = headerLine.split(/\s+/);
  // like Python: use 1..-2 as body
  const body = lines.slice(1, lines.length - 2).map((l) => l.split(/\s+/));

  // helpers

  const getRegisteredNumber = (x: string) => x.slice(4, 10);
  const getBankCode = (x: string) => x.slice(1, 5);
  const getStoreCode = (x: string) => x.slice(0, 3);

  // make this ALWAYS return 3 strings
  const getBankDetail = (a: string, b: string): [string, string, string] => {
    const col1 = a?.[0] ?? "";
    const col2 = a?.slice(1, 8) ?? "";
    const col3 = (a?.slice(8) ?? "") + (b ?? "");
    return [col1, col2, col3];
  };

  const getFee = (x: string) => (x ?? "").slice(0, 10);
  const getContractNumber = (x: string) => (x ?? "").slice(-15, -1);
  const newUser = (x: string) => (x ?? "")[10] ?? "";

  const createFormattedData = (
    row: string[],
    header: string[],
    year: Ref<string>,
    month: Ref<string>
  ): JaccsRecord => {
    const h0 = header[0] ?? "";

    const headerData: JaccsHeader = {
      registeredNumber: getRegisteredNumber(h0),
      // if year/month provided by UI, use that; else use header date
      date: `${year.value}${month.value}` || "",
    };

    const row0 = row[0] ?? "";
    const row1 = row[1] ?? "";
    const row2 = row[2] ?? "";
    const row3 = row[3] ?? "";

    let idx = 3;
    const isNumeric = /^\d+$/.test(row[idx] ?? "");
    const detail = isNumeric
      ? getBankDetail(row2, "")
      : getBankDetail(row2, row3);
    if (!isNumeric) {
      idx++; // same as Python
    }

    const feeSource = row[idx] ?? "";

    const rowData: JaccsRow = {
      bankCode: getBankCode(row0),
      storeCode: getStoreCode(row1),
      detail,
      fee: getFee(feeSource),
      isNewUser: newUser(feeSource),
      contractNumber: getContractNumber(feeSource),
    };

    return { header: headerData, data: rowData };
  };

  // 3. build records
  const records: JaccsRecord[] = body.map((row) =>
    createFormattedData(row, header, year, month)
  );

  // 4. turn into CSV like Python (all quoted)
  const csvRows = records.map((r) => {
    const arr = [
      companyCode.value,
      yearMonth.value,
      r.data.bankCode,
      r.data.storeCode,
      ...r.data.detail,
      r.data.fee,
      r.data.isNewUser,
      r.data.contractNumber,
    ];
    return arr.map((v) => `"${v}"`).join(",");
  });

  const csv = csvRows.join("\r\n") + "\r\n";
  return csv;
};

type JaccsValidationResult = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  headerLine?: string;
  rowCount: number;
};

const validateJaccs = async (
  file: File,
  month: Ref<string>,
  year: Ref<string>
): Promise<JaccsValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. read file
  const buf = await file.arrayBuffer();
  const text = new TextDecoder("shift_jis").decode(buf);

  // 2. parse lines
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) {
    errors.push("File is empty.");
    return { ok: false, errors, warnings, rowCount: 0 };
  }

  const headerLine = lines[0] ?? "";
  const header = headerLine.split(/\s+/);

  // header checks
  if (!header[0]) {
    errors.push("Header column 1 is missing.");
  } else if ((header[0] ?? "").length < 10) {
    // getRegisteredNumber uses slice(4,10)
    warnings.push("Header column 1 may be shorter than expected.");
  }

  if (!header[1]) {
    errors.push("Header column 2 (date) is missing.");
  }

  // like Python: use 1..-2 as body
  const body = lines.slice(1, lines.length - 2).map((l) => l.split(/\s+/));
  if (body.length === 0) {
    errors.push("No detail rows found.");
  }

  // 3. validate each row according to convertJaccs logic
  body.forEach((row, index) => {
    const lineNo = index + 2; // header=1行目, 明細は2行目〜

    const row0 = row[0] ?? "";
    const row1 = row[1] ?? "";
    const row2 = row[2] ?? "";
    const row3 = row[3] ?? "";

    if (!row0) {
      errors.push(`Line ${lineNo}: Bank code (col 1) is empty.`);
    }
    if (!row1) {
      errors.push(`Line ${lineNo}: Store code (col 2) is empty.`);
    }
    if (!row2) {
      errors.push(`Line ${lineNo}: Detail (col 3) is empty.`);
    }

    let idx = 3;
    const isNumeric = /^\d+$/.test(row[idx] ?? "");

    // when not numeric, convertJaccs uses row[3] in getBankDetail and then increments idx
    if (!isNumeric && !row3) {
      errors.push(
        `Line ${lineNo}: Continuation detail (col 4) is required but empty (detail is expected to be col 3 + col 4).`
      );
    }

    if (!isNumeric) {
      idx++; // same as convertJaccs
    }

    const feeSource = row[idx];

    if (feeSource === undefined || feeSource === "") {
      errors.push(
        `Line ${lineNo}: Column that contains fee and contract number is missing (index=${idx}).`
      );
    } else {
      if (feeSource.length < 11) {
        warnings.push(
          `Line ${lineNo}: Fee column may be too short (includes new-user flag position).`
        );
      }
      if (feeSource.length < 16) {
        warnings.push(
          `Line ${lineNo}: Column may be too short to read the last 15 digits of contract number.`
        );
      }
    }
  });

  // optional: check year/month vs header date consistency
  if (!year.value || !month.value) {
    warnings.push(
      "Year and month are not specified in the UI. Header date will be used instead."
    );
  }

  const ok = errors.length === 0;

  return {
    ok,
    errors,
    warnings,
    headerLine,
    rowCount: body.length,
  };
};
</script>
