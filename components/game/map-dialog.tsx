"use client"

import type React from "react"
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import type { GameState } from "../../state/game-state"
import type { Supplier } from "../../model/supplier"
import type { Customer } from "../../model/customer"
import type { LevelConfig } from "../../model/level-config"
import { SupplyChainMap } from "./supply-chain-map"
import type { Order } from "../../model/order"
import type { CustomerOrder } from "../../model/customer-order"

interface MapDialogProps {
  open: boolean
  onClose: () => void
  pendingOrders: Order[]
  pendingCustomerOrders: CustomerOrder[]
  gameState: GameState
  suppliers: Supplier[]
  customers: Customer[]
  levelConfig: LevelConfig | undefined
  onSupplierClick: (supplier: Supplier) => void
  onFactoryClick: () => void
  onRestaurantClick: () => void
  level?: number
}

export const MapDialog: React.FC<MapDialogProps> = ({
  open,
  onClose,
  pendingOrders,
  pendingCustomerOrders,
  gameState,
  suppliers,
  customers,
  levelConfig,
  onSupplierClick,
  onFactoryClick,
  onRestaurantClick,
  level,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xl">
      <DialogTitle>
        Supply Chain Map
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <SupplyChainMap
          pendingOrders={pendingOrders}
          pendingCustomerOrders={pendingCustomerOrders}
          gameState={gameState}
          suppliers={suppliers}
          customers={customers}
          levelConfig={levelConfig}
          onSupplierClick={onSupplierClick}
          onFactoryClick={onFactoryClick}
          onRestaurantClick={onRestaurantClick}
          level={level}
        />
      </DialogContent>
    </Dialog>
  )
}
