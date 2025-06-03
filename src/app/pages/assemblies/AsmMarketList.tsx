import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Plus } from "lucide-react";
import { useSelectedItemStore } from "@/stores/AsmBuild";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Listing {
  listing_id: number;
  seller_id: number;
  name: string | null;
  brand: string | null;
  spec: string | null;
  unit_of_measurement: string | null;
  min_quantity: number | null;
  cost: number | null;
  total_price: number | null;
  delivery_time: string | null;
  seller?: Seller;
}

interface Seller {
  supplier_id: number;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
}

const MarketplacePage = ({ searchTerm }: { searchTerm: string }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const { addSelectedItem } = useSelectedItemStore();

  const fetchMarketplaceData = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("seller_listings")
      .select(`
        *,
        sellers: seller_id (
          supplier_id,
          company_name,
          contact_name,
          contact_email,
          phone,
          address,
          website
        )
      `)
      .order("listing_id", { ascending: true });

    if (error) {
      console.error("Error fetching listings:", error.message);
      setLoading(false);
      return;
    }

    const enrichedData = data!.map((listing: any) => ({
      ...listing,
      seller: listing.sellers,
    }));

    setListings(enrichedData);
    setLoading(false);
  };

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  const filteredListings = listings.filter(
    (listing) =>
      listing.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.seller?.company_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const handleAdd = (listing: Listing) => {
    console.log("Add clicked for listing:", listing);

    // Store as a "product" type in the shared store
    addSelectedItem({
      id: listing.listing_id.toString(),
      type: "product",
    });
  };

  return (
    <>
      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : filteredListings.length === 0 ? (
        <p className="text-gray-400">No listings found.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredListings.map((listing) => (
            <div
              key={listing.listing_id}
              className="border border-gray-200 rounded p-3 hover:bg-gray-50 transition flex flex-col gap-1"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-gray-700">
                    {listing.name || "Unnamed Listing"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {listing.brand || "-"}
                  </div>
                </div>
                <button
                  onClick={() => handleAdd(listing)}
                  className="p-1 rounded hover:bg-blue-100 transition"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Spec: {listing.spec || "-"}
              </div>
              <div className="text-xs text-gray-500">
                {listing.min_quantity && listing.unit_of_measurement
                  ? `Min: ${listing.min_quantity} ${listing.unit_of_measurement}`
                  : "No min. quantity specified"}
                {" | "}
                Delivery: {listing.delivery_time || "-"}
              </div>
              <div className="text-sm font-medium text-blue-600">
                Cost: {listing.cost ? `$${listing.cost.toFixed(2)}` : "-"} | Total:{" "}
                {listing.total_price
                  ? `$${listing.total_price.toFixed(2)}`
                  : "-"}
              </div>
              {listing.seller && (
                <div className="text-xs text-gray-500">
                  Seller: {listing.seller.company_name || "-"} | Contact:{" "}
                  {listing.seller.contact_email || "-"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default MarketplacePage;
