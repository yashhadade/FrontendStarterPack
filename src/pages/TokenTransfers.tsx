import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable, { DataTableColumn } from "@/components/DataTable";
import assetsServices from "@/services/assetsServices";
import { formatIndianNumber } from "@/utils/numberFormat";

const TokenTransfers = () => {
  const [assetsRequests, setAssetsRequests] = useState<any[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchAssetsRequests = async () => {
      const res = await assetsServices.getAssetsRequests();
      if (res?.data) {
        console.log(res.data);
        setAssetsRequests(res.data);
      }
    };
    fetchAssetsRequests();
  }, []);

  const columns: DataTableColumn<any>[] = [
    {
      key: "assetName",
      header: "Asset",
      className: "text-foreground font-medium",
    },
    {
      key: "sellerName",
      header: "Client Name",
      className: "text-muted-foreground text-xs",
    },
    {
      key: "totalAssetValueInInr",
      header: "Value",
      className: "font-mono text-xs text-foreground",
      render: (prop) => `₹${prop.totalAssetValueInInr}`,
    },
    {
      key: "noOfTokens",
      header: "No. of Tokens",
      className: "font-mono text-xs text-center text-foreground",
      render: (row) => formatIndianNumber(row?.noOfTokens),
    },
    {
      key: "noOfTokensForDistribution",
      header: "Distributed Tokens",
      className: "font-mono text-xs text-center text-foreground",
      render: (row) => formatIndianNumber(row?.noOfTokensForDistribution),
    },
    {
      key: "status",
      header: "Status",
      sortable: false,
      render: (prop) => (
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-medium 
            ${
            prop.status === "COMPLETED"
              ? "progress-step-done"
              : prop.status === "PENDING"
              ? "status-pending"
              : prop.status === "REJECTED"
              ? "status-rejected"
              : prop.status === "ASSET_CREATION_PROCESSING"
              ? "progress-step-active"
              : prop.status === "ASSET_CREATED"
              ? "progress-step-done"            
              : prop.status === "APPROVED"
              ? "status-approved"
              :"bg-secondary/10 text-secondary border border-secondary/20"
          }`
        }
        >
          {prop.status}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      align: "right",
      sortable: false,
      render: (prop) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/assets-requests/${prop._id}`);
          }}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          Open
        </button>
      ),
    },
  ];

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assets Requests</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage assets requests</p>
      </div>

      <DataTable
        data={assetsRequests}
        columns={columns}
        getRowId={(row) => row._id}
        searchableKeys={["assetName", "sellerName", "totalAssetValueInInr", "status"]}
        searchPlaceholder="Search by ID, asset, or client..."
        onRowClick={(row) => navigate(`/assets-requests/${row._id}`)}
      />
    </div>
  );
};

export default TokenTransfers;
