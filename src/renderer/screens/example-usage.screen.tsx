import { useState } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  PDFViewer,
  Font,
  Image,
  Svg,
  Path,
  Circle,
  Rect,
  G,
} from "@react-pdf/renderer";

// Import logo
import logoImage from "../assets/E-POS-logo-1.png";
import { Modal } from "../components/modal";

// Register fonts
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf",
});

// Register Thai font - Noto Sans Thai with correct TTF URLs
Font.register({
  family: "Noto Sans Thai",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/notosansthai/v28/iJWnBXeUZi_OHPqn4wq6hQ2_hbJ1xyN9wd43SofNWcd1MKVQt_So_9CdU5RtpzE.ttf",
      fontWeight: 400,
      fontStyle: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/notosansthai/v28/iJWnBXeUZi_OHPqn4wq6hQ2_hbJ1xyN9wd43SofNWcd1MKVQt_So_9CdU6ZtpzE.ttf",
      fontWeight: 500,
      fontStyle: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/notosansthai/v28/iJWnBXeUZi_OHPqn4wq6hQ2_hbJ1xyN9wd43SofNWcd1MKVQt_So_9CdU3NqpzE.ttf",
      fontWeight: 700,
      fontStyle: "normal",
    },
  ],
});

// Alternative registration method - simpler approach
Font.register({
  family: "NotoSansThai",
  src: "https://fonts.gstatic.com/s/notosansthai/v28/iJWnBXeUZi_OHPqn4wq6hQ2_hbJ1xyN9wd43SofNWcd1MKVQt_So_9CdU5RtpzE.ttf",
});

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
    color: "#2563eb",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 100,
    // height: 40,
    marginBottom: 10,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  svg: { width: 100, height: 100 },
  text: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 1.5,
  },
  boldText: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 20,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCell: {
    margin: "auto",
    marginTop: 5,
    fontSize: 10,
    padding: 5,
  },
  footer: {
    position: "absolute",
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "grey",
  },
  thaiText: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 1.5,
    fontFamily: "NotoSansThai",
  },
  thaiBoldText: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    fontFamily: "NotoSansThai",
  },
});

// Sample data for the PDF
const sampleData = {
  title: "Sample PDF Report",
  titleThai: "รายงานตัวอย่าง PDF",
  date: new Date().toLocaleDateString(),
  items: [
    {
      id: 1,
      name: "Product A",
      nameThai: "สินค้า เอ",
      price: "$29.99",
      quantity: 2,
    },
    {
      id: 2,
      name: "Product B",
      nameThai: "สินค้า บี",
      price: "$49.99",
      quantity: 1,
    },
    {
      id: 3,
      name: "Product C",
      nameThai: "สินค้า ซี",
      price: "$19.99",
      quantity: 3,
    },
    {
      id: 4,
      name: "Product D",
      nameThai: "สินค้า ดี",
      price: "$39.99",
      quantity: 1,
    },
  ],
};

// PDF Document Component
const MyDocument = ({ data }: { data: typeof sampleData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Image
          style={styles.logo}
          src={logoImage}
        />
      </View>

      <Text style={styles.header}>{data.title}</Text>

      {/* <View style={styles.section}>
        <Text style={styles.boldText}>Report Generated: {data.date}</Text>
        <Text style={styles.text}>
          This is a sample PDF document generated using @react-pdf/renderer in
          an Electron application. This library allows you to create PDF
          documents using React components with a declarative API.
        </Text>

        <Text style={styles.boldText}>Features Demonstrated:</Text>
        <Text style={styles.text}>• Custom styling with StyleSheet</Text>
        <Text style={styles.text}>• Text formatting and layout</Text>
        <Text style={styles.text}>• Table creation</Text>
        <Text style={styles.text}>• Dynamic data rendering</Text>
        <Text style={styles.text}>• PDF download functionality</Text>
        <Text style={styles.text}>• Thai language font support</Text>
      </View> */}

      <View style={styles.section}>
        <Text style={styles.thaiBoldText}>ข้อมูลภาษาไทย: {data.titleThai}</Text>
        <Text style={styles.thaiText}>
          นี่คือตัวอย่างเอกสาร PDF ที่สร้างขึ้นโดยใช้ @react-pdf/renderer
          ในแอปพลิเคชัน Electron ไลบรารีนี้ช่วยให้คุณสามารถสร้างเอกสาร PDF
          โดยใช้คอมโพเนนต์ React ด้วย API แบบ declarative
        </Text>

        <Text style={styles.thaiBoldText}>คุณสมบัติที่แสดง:</Text>
        <Text style={styles.thaiText}>• การจัดรูปแบบด้วย StyleSheet</Text>
        <Text style={styles.thaiText}>• การจัดรูปแบบข้อความและเลย์เอาต์</Text>
        <Text style={styles.thaiText}>• การสร้างตาราง</Text>
        <Text style={styles.thaiText}>• การแสดงข้อมูลแบบไดนามิก</Text>
        <Text style={styles.thaiText}>• ฟังก์ชันการดาวน์โหลด PDF</Text>
        <Text style={styles.thaiText}>• รองรับฟอนต์ภาษาไทย</Text>
        {/* <Svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-accessibility-icon lucide-accessibility"
        >
          <Circle cx="16" cy="4" r="1" />
          <Path d="m18 19 1-7-6 1" />
          <Path d="m5 8 3-3 5.5 3-2.36 3.5" />
          <Path d="M4.24 14.5a5 5 0 0 0 6.88 6" />
          <Path d="M13.76 17.5a5 5 0 0 0-6.88-6" />
        </Svg> */}
        {/* <Svg
          viewBox="0 0 24 24"
          width={20}
          height={20}
          stroke={"black"}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" />
        </Svg> */}
        <Svg width="30" height="30" viewBox="0 0 512 512">
          <G>
            <Path
              d="M194.651,414.476c16.23,0,61.349,0,61.349,0s45.111,0,61.35,0c16.222,0,23.587-23.603,14.198-40.285
        c-7.072-12.572-18.659-26.826-37.516-34.921c-10.793,7.556-23.905,12-38.032,12c-14.143,0-27.238-4.444-38.032-12
        c-18.864,8.095-30.444,22.349-37.523,34.921C171.064,390.873,178.421,414.476,194.651,414.476z"
              fill="#000000"
            />
            <Path
              d="M256,335.476c27.714,0,50.167-22.444,50.167-50.159v-12.016c0-27.714-22.452-50.174-50.167-50.174
        c-27.714,0-50.174,22.46-50.174,50.174v12.016C205.826,313.032,228.286,335.476,256,335.476z"
              fill="#000000"
            />
            <Path
              d="M404.977,56.889h-75.834v16.254c0,31.365-25.524,56.889-56.889,56.889h-32.508
        c-31.365,0-56.889-25.524-56.889-56.889V56.889h-75.833c-25.445,0-46.072,20.627-46.072,46.071v362.969
        c0,25.444,20.627,46.071,46.072,46.071h297.952c25.444,0,46.071-20.627,46.071-46.071V102.96
        C451.048,77.516,430.421,56.889,404.977,56.889z M402.286,463.238H109.714V150.349h292.572V463.238z"
              fill="#000000"
            />
            <Path
              d="M239.746,113.778h32.508c22.406,0,40.635-18.23,40.635-40.635V40.635C312.889,18.23,294.659,0,272.254,0
        h-32.508c-22.405,0-40.635,18.23-40.635,40.635v32.508C199.111,95.547,217.341,113.778,239.746,113.778z
        M231.619,40.635c0-4.492,3.635-8.127,8.127-8.127h32.508c4.493,0,8.127,3.635,8.127,8.127v16.254
        c0,4.492-3.634,8.127-8.127,8.127h-32.508c-4.492,0-8.127-3.635-8.127-8.127V40.635z"
              fill="#000000"
            />
          </G>
        </Svg>
      </View>

      <View style={styles.section}>
        <Text style={styles.boldText}>Sample Data Table:</Text>
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            <View style={styles.tableCol}>
              <Text style={[styles.tableCell, styles.boldText]}>ID</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={[styles.tableCell, styles.boldText]}>
                Product Name
              </Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={[styles.tableCell, styles.boldText]}>Price</Text>
            </View>
            <View style={styles.tableCol}>
              <Text style={[styles.tableCell, styles.boldText]}>Quantity</Text>
            </View>
          </View>

          {/* Table Rows */}
          {data.items.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.id}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.name}</Text>
                <Text
                  style={[
                    styles.tableCell,
                    { fontSize: 8, marginTop: 2, fontFamily: "NotoSansThai" },
                  ]}
                >
                  {item.nameThai}
                </Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.price}</Text>
              </View>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{item.quantity}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.footer}>
        Generated by Electron App with @react-pdf/renderer - Page 1
      </Text>
    </Page>
  </Document>
);

export function ExampleUsageScreen() {
  const [showPreview, setShowPreview] = useState(false);
  const [customTitle, setCustomTitle] = useState(sampleData.title);
  const [customTitleThai, setCustomTitleThai] = useState(sampleData.titleThai);
  const [logoError, setLogoError] = useState(false);

  const currentData = {
    ...sampleData,
    title: customTitle,
    titleThai: customTitleThai,
    date: new Date().toLocaleDateString(),
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-4xl mx-auto">
      {/* Logo Section */}
      <div className="flex flex-col items-center mb-4">
        {!logoError ? (
          <img
            src={logoImage}
            alt="E-POS Logo"
            className="w-32 h-16 object-contain mb-4"
            onError={() => setLogoError(true)}
          />
        ) : (
          <div className="w-32 h-16 bg-gray-200 flex items-center justify-center mb-4 rounded">
            <span className="text-gray-500 text-sm">E-POS Logo</span>
          </div>
        )}
        <h1 className="text-3xl font-bold text-center">
          React PDF Renderer Example
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 w-full">
        <h2 className="text-xl font-semibold mb-4">PDF Generation Controls</h2>

        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700 mb-2">
            <strong>Thai Font Test:</strong> The following text should display
            in Thai characters:
          </p>
          <p
            className="text-lg"
            style={{ fontFamily: "Noto Sans Thai, sans-serif" }}
          >
            สวัสดีครับ นี่คือการทดสอบฟอนต์ภาษาไทย ในการสร้าง PDF
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              PDF Title:
            </label>
            <input
              id="title"
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter PDF title..."
            />
          </div>

          <div>
            <label
              htmlFor="titleThai"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              PDF Title (Thai):
            </label>
            <input
              id="titleThai"
              type="text"
              value={customTitleThai}
              onChange={(e) => setCustomTitleThai(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ใส่ชื่อเรื่อง PDF ภาษาไทย..."
              style={{ fontFamily: "Noto Sans Thai, sans-serif" }}
            />
          </div>

          <div className="flex gap-4">
            <PDFDownloadLink
              document={<MyDocument data={currentData} />}
              fileName={`${customTitle.replace(/\s+/g, "_").toLowerCase()}.pdf`}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              {({ loading }) =>
                loading ? "Generating PDF..." : "Download PDF"
              }
            </PDFDownloadLink>

            <button
              onClick={() => setShowPreview(!showPreview)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
          </div>
        </div>

        {showPreview && (
          <Modal isOpen={showPreview} onClose={() => setShowPreview(false)}>
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b rounded-t-lg">
              <h3 className="text-lg font-semibold">PDF Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="ml-4 text-gray-400 hover:text-gray-700 focus:outline-none"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div style={{ height: "600px" }} className="w-full">
              <PDFViewer width="100%" height="100%">
                <MyDocument data={currentData} />
              </PDFViewer>
            </div>
          </Modal>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-6 w-full">
        <h2 className="text-xl font-semibold mb-4">Code Example</h2>
        <pre className="bg-gray-800 text-green-400 p-4 rounded-md overflow-x-auto text-sm">
          {`import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer'

// Register Thai font - Use TTF format for better compatibility
Font.register({
  family: "NotoSansThai",
  src: "https://fonts.gstatic.com/s/notosansthai/v28/iJWnBXeUZi_OHPqn4wq6hQ2_hbJ1xyN9wd43SofNWcd1MKVQt_So_9CdU5RtpzE.ttf"
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  thaiText: {
    fontFamily: "NotoSansThai",
    fontSize: 12
  }
})

const MyDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text>Hello World!</Text>
        <Text style={styles.thaiText}>สวัสดีครับ</Text>
      </View>
    </Page>
  </Document>
)

// Usage in component
<PDFDownloadLink document={<MyDocument />} fileName="example.pdf">
  {({ loading }) => (loading ? 'Loading...' : 'Download PDF')}
</PDFDownloadLink>`}
        </pre>
      </div>
    </div>
  );
}
