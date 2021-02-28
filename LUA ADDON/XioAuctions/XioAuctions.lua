local _, xa = ...
local private = { items = {} }
local XioAuctionsFrame = nil

function XioAuctions_OnLoad(self)
	print("XioAuctions_OnLoad")
	self:RegisterEvent("AUCTION_HOUSE_SHOW")
	self:RegisterEvent("AUCTION_HOUSE_CLOSED")
	-- self:RegisterEvent("AUCTION_HOUSE_BROWSE_RESULTS_UPDATED")
	self:RegisterEvent("COMMODITY_SEARCH_RESULTS_UPDATED")
	self:RegisterEvent("ITEM_SEARCH_RESULTS_UPDATED")
end

function XioAuctions_Show()
	if not private.hasShown then
		private.hasShown = true
		local tabId = AuctionHouseFrame.numTabs + 1
		local tab = CreateFrame("Button", "AuctionFrameTab"..tabId, AuctionHouseFrame, "AuctionHouseFrameTabTemplate")
		tab:Hide()
		tab:SetID(tabId)
		tab:SetText("XioAuctions")
		tab:SetNormalFontObject(GameFontHighlightSmall)
		tab:SetPoint("LEFT", AuctionHouseFrame.Tabs[tabId - 1], "RIGHT", -15, 0)
		tinsert(AuctionHouseFrame.Tabs, tab)
		tab:Show()
		PanelTemplates_SetNumTabs(AuctionHouseFrame, tabId)
		PanelTemplates_EnableTab(AuctionHouseFrame, tabId)
		tab:SetScript("OnClick", XioAuctions_Run)
	end
end

function XioAuctions_Run()
	if not XioAuctionsFrame then
		print('XioAuctions - dialog')
		local f = CreateFrame("Frame", "XioAuctionsFrame", UIParent, "DialogBoxFrame")
		f:SetSize(400, 300)
		f:SetBackdrop({
	      bgFile = "Interface\\DialogFrame\\UI-DialogBox-Background",
	      edgeFile = "Interface\\PVPFrame\\UI-Character-PVP-Highlight",
	      edgeSize = 16,
	      insets = { left = 8, right = 8, top = 8, bottom = 8 },
	    })

		-- scroll frame
	    local sf = CreateFrame("ScrollFrame", "XioAuctionsScrollFrame", f, "UIPanelScrollFrameTemplate")
	    sf:SetPoint("LEFT", 16, 0)
	    sf:SetPoint("RIGHT", -32, 0)
	    sf:SetPoint("TOP", 0, -32)
	    sf:SetPoint("BOTTOM", XioAuctionsFrameButton, "TOP", 0, 0)

	    -- edit box
	    local eb = CreateFrame("EditBox", "XioAuctionsEditBox", XioAuctionsScrollFrame)
	    eb:SetSize(sf:GetSize())
	    eb:SetMultiLine(true)
	    eb:SetAutoFocus(true)
	    eb:SetFontObject("ChatFontNormal")
	    eb:SetScript("OnEscapePressed", function() f:Hide() end)
	    sf:SetScrollChild(eb)
	    XioAuctionsFrame = f
	end
	local x = ''
	for k,v in pairs(private.items) do
		x = x .. k .. "," .. v .. "~"
	end
	x = strsub(x, 1, strlen(x) - 1)
  	XioAuctionsEditBox:SetText(x)
  	XioAuctionsEditBox:HighlightText()
  	XioAuctionsFrame:Show()	
end

function XioAuctions_OnEvent(self, event, ...)
	if event == "AUCTION_HOUSE_SHOW" then
		XioAuctions_Show()
	elseif event == "AUCTION_HOUSE_CLOSED" then
		wipe(private.items)
	elseif event == "COMMODITY_SEARCH_RESULTS_UPDATED" then
		local itemId = ...
		private.items[itemId] = ""
		for i = 1, C_AuctionHouse.GetNumCommoditySearchResults(itemId) do
		 	local result = C_AuctionHouse.GetCommoditySearchResultInfo(itemId, i)
		 	
		 	private.items[itemId] = private.items[itemId] .. result.quantity .. "&" .. result.unitPrice .. "|"
    	end
		_, sName = GetItemInfo(itemId)
		print('XioAuctions - handled', sName)
	else
		print('Xioauctions - event', event, ...)
	end	
end

function XioAuctions_OnUpdate(self, elapsed)
	--print("XioAuctions onUpdate", event)
end


SLASH_CMDS1 = "/xioauctions"
SLASH_CMDS2 = "/xioa"
SlashCmdList["CMDS"] = XioAuctions_Run