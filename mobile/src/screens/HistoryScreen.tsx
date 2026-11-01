import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

interface HistoryScreenProps {
  onBack: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack }) => {
  const { token, apiUrl } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHistory = async (pageNum = 1) => {
    try {
      if (!token) return;
      const res = await fetch(
        `${apiUrl}/attendance/my-history?page=${pageNum}&limit=15`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (pageNum === 1) {
            setRecords(data.records);
          } else {
            setRecords((prev) => [...prev, ...data.records]);
          }
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (e) {
      console.log("Failed to load history:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchHistory(1);
  };

  const loadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHistory(nextPage);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const cin = item.checkIn;
    const cout = item.checkOut;
    const destName = item.destinationId
      ? item.destinationId.name
      : item.customDestination || "Custom Site";

    return (
      <View style={styles.recordCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.destName} numberOfLines={1}>
              {destName}
            </Text>
            <Text style={styles.purposeText} numberOfLines={1}>
              {item.purpose}
            </Text>
          </View>
          <View
            style={[
              styles.statusPill,
              item.status === "checked_out"
                ? styles.statusPillOut
                : styles.statusPillIn,
            ]}
          >
            <Text
              style={[
                styles.statusPillText,
                item.status === "checked_out"
                  ? styles.statusPillTextOut
                  : styles.statusPillTextIn,
              ]}
            >
              {item.status === "checked_out" ? "Completed" : "Active"}
            </Text>
          </View>
        </View>

        <View style={styles.eventRow}>
          <View style={styles.eventBlock}>
            <View style={styles.eventTitleRow}>
              <Ionicons name="log-in-outline" size={14} color="#2563EB" />
              <Text style={styles.eventTitle}>Check-In</Text>
            </View>
            <Text style={styles.timeText}>
              {cin?.timestamp ? new Date(cin.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}
            </Text>
            <Text style={styles.dateText}>
              {cin?.timestamp ? new Date(cin.timestamp).toLocaleDateString() : ""}
            </Text>
            {cin?.latitude && (
              <Text style={styles.coordsText}>
                {cin.latitude.toFixed(4)}, {cin.longitude.toFixed(4)}
              </Text>
            )}
          </View>

          <View style={styles.eventDivider} />

          <View style={styles.eventBlock}>
            <View style={styles.eventTitleRow}>
              <Ionicons name="log-out-outline" size={14} color="#059669" />
              <Text style={styles.eventTitle}>Check-Out</Text>
            </View>
            <Text style={styles.timeText}>
              {cout?.timestamp ? new Date(cout.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
            </Text>
            <Text style={styles.dateText}>
              {cout?.timestamp ? new Date(cout.timestamp).toLocaleDateString() : "In progress"}
            </Text>
            {cout?.latitude && (
              <Text style={styles.coordsText}>
                {cout.latitude.toFixed(4)}, {cout.longitude.toFixed(4)}
              </Text>
            )}
          </View>
        </View>

        {item.durationMinutes !== null && item.durationMinutes !== undefined && (
          <View style={styles.durationFooter}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text style={styles.durationText}>
              Total Time: {item.durationMinutes} minutes
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attendance History</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading past visits...</Text>
        </View>
      ) : records.length > 0 ? (
        <FlatList
          data={records}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Ionicons name="documents-outline" size={54} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Attendance Records</Text>
          <Text style={styles.emptySub}>
            Your completed check-in and check-out logs will appear here.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 14,
  },
  emptySub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  recordCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  destName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  purposeText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillOut: {
    backgroundColor: "#F1F5F9",
  },
  statusPillIn: {
    backgroundColor: "#D1FAE5",
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusPillTextOut: {
    color: "#475569",
  },
  statusPillTextIn: {
    color: "#047857",
  },
  eventRow: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  eventBlock: {
    flex: 1,
  },
  eventDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },
  eventTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  dateText: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 1,
  },
  coordsText: {
    fontSize: 10,
    fontFamily: "monospace",
    color: "#94A3B8",
    marginTop: 2,
  },
  durationFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  durationText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
  },
});
