"""Curated list of popular NSE stocks and ETFs for fast autocomplete search.

Format: (symbol_without_suffix, display_name, exchange)
yfinance symbols use .NS suffix for NSE and .BO for BSE.
"""

NSE_STOCKS = [
    ("RELIANCE", "Reliance Industries Ltd"),
    ("TCS", "Tata Consultancy Services Ltd"),
    ("HDFCBANK", "HDFC Bank Ltd"),
    ("INFY", "Infosys Ltd"),
    ("ICICIBANK", "ICICI Bank Ltd"),
    ("HINDUNILVR", "Hindustan Unilever Ltd"),
    ("SBIN", "State Bank of India"),
    ("BHARTIARTL", "Bharti Airtel Ltd"),
    ("ITC", "ITC Ltd"),
    ("KOTAKBANK", "Kotak Mahindra Bank Ltd"),
    ("LT", "Larsen & Toubro Ltd"),
    ("AXISBANK", "Axis Bank Ltd"),
    ("ASIANPAINT", "Asian Paints Ltd"),
    ("MARUTI", "Maruti Suzuki India Ltd"),
    ("BAJFINANCE", "Bajaj Finance Ltd"),
    ("HCLTECH", "HCL Technologies Ltd"),
    ("WIPRO", "Wipro Ltd"),
    ("TITAN", "Titan Company Ltd"),
    ("SUNPHARMA", "Sun Pharmaceutical Industries Ltd"),
    ("ULTRACEMCO", "UltraTech Cement Ltd"),
    ("NESTLEIND", "Nestle India Ltd"),
    ("NTPC", "NTPC Ltd"),
    ("POWERGRID", "Power Grid Corporation of India Ltd"),
    ("TECHM", "Tech Mahindra Ltd"),
    ("BAJAJFINSV", "Bajaj Finserv Ltd"),
    ("ADANIENT", "Adani Enterprises Ltd"),
    ("ADANIPORTS", "Adani Ports and SEZ Ltd"),
    ("COALINDIA", "Coal India Ltd"),
    ("ONGC", "Oil and Natural Gas Corporation Ltd"),
    ("JSWSTEEL", "JSW Steel Ltd"),
    ("TATASTEEL", "Tata Steel Ltd"),
    ("TATAMOTORS", "Tata Motors Ltd"),
    ("M&M", "Mahindra & Mahindra Ltd"),
    ("HINDALCO", "Hindalco Industries Ltd"),
    ("GRASIM", "Grasim Industries Ltd"),
    ("DRREDDY", "Dr Reddys Laboratories Ltd"),
    ("CIPLA", "Cipla Ltd"),
    ("DIVISLAB", "Divis Laboratories Ltd"),
    ("APOLLOHOSP", "Apollo Hospitals Enterprise Ltd"),
    ("EICHERMOT", "Eicher Motors Ltd"),
    ("BAJAJ-AUTO", "Bajaj Auto Ltd"),
    ("HEROMOTOCO", "Hero MotoCorp Ltd"),
    ("BRITANNIA", "Britannia Industries Ltd"),
    ("TATACONSUM", "Tata Consumer Products Ltd"),
    ("INDUSINDBK", "IndusInd Bank Ltd"),
    ("SBILIFE", "SBI Life Insurance Company Ltd"),
    ("HDFCLIFE", "HDFC Life Insurance Company Ltd"),
    ("BPCL", "Bharat Petroleum Corporation Ltd"),
    ("IOC", "Indian Oil Corporation Ltd"),
    ("GAIL", "GAIL (India) Ltd"),
    ("LTIM", "LTIMindtree Ltd"),
    ("PIDILITIND", "Pidilite Industries Ltd"),
    ("DMART", "Avenue Supermarts Ltd"),
    ("DABUR", "Dabur India Ltd"),
    ("GODREJCP", "Godrej Consumer Products Ltd"),
    ("MARICO", "Marico Ltd"),
    ("COLPAL", "Colgate Palmolive India Ltd"),
    ("AMBUJACEM", "Ambuja Cements Ltd"),
    ("SHREECEM", "Shree Cement Ltd"),
    ("ACC", "ACC Ltd"),
    ("VEDL", "Vedanta Ltd"),
    ("DLF", "DLF Ltd"),
    ("GODREJPROP", "Godrej Properties Ltd"),
    ("INDIGO", "InterGlobe Aviation Ltd"),
    ("IRCTC", "Indian Railway Catering and Tourism Corporation Ltd"),
    ("NAUKRI", "Info Edge (India) Ltd"),
    ("ZOMATO", "Zomato Ltd"),
    ("PAYTM", "One 97 Communications Ltd"),
    ("NYKAA", "FSN E-Commerce Ventures Ltd"),
    ("POLICYBZR", "PB Fintech Ltd"),
    ("LICI", "Life Insurance Corporation of India"),
    ("ICICIPRULI", "ICICI Prudential Life Insurance"),
    ("ICICIGI", "ICICI Lombard General Insurance"),
    ("BANKBARODA", "Bank of Baroda"),
    ("PNB", "Punjab National Bank"),
    ("CANBK", "Canara Bank"),
    ("IDFCFIRSTB", "IDFC First Bank Ltd"),
    ("FEDERALBNK", "Federal Bank Ltd"),
    ("BANDHANBNK", "Bandhan Bank Ltd"),
    ("AUBANK", "AU Small Finance Bank Ltd"),
    ("CHOLAFIN", "Cholamandalam Investment and Finance"),
    ("BAJAJHLDNG", "Bajaj Holdings & Investment Ltd"),
    ("TVSMOTOR", "TVS Motor Company Ltd"),
    ("ASHOKLEY", "Ashok Leyland Ltd"),
    ("MOTHERSON", "Samvardhana Motherson International Ltd"),
    ("BOSCHLTD", "Bosch Ltd"),
    ("MRF", "MRF Ltd"),
    ("TRENT", "Trent Ltd"),
    ("PAGEIND", "Page Industries Ltd"),
    ("BERGEPAINT", "Berger Paints India Ltd"),
    ("HAVELLS", "Havells India Ltd"),
    ("VOLTAS", "Voltas Ltd"),
    ("CROMPTON", "Crompton Greaves Consumer Electricals"),
    ("SIEMENS", "Siemens Ltd"),
    ("ABB", "ABB India Ltd"),
    ("BHEL", "Bharat Heavy Electricals Ltd"),
    ("CUMMINSIND", "Cummins India Ltd"),
    ("BEL", "Bharat Electronics Ltd"),
    ("HAL", "Hindustan Aeronautics Ltd"),
    ("BDL", "Bharat Dynamics Ltd"),
    ("MAZDOCK", "Mazagon Dock Shipbuilders Ltd"),
    ("COCHINSHIP", "Cochin Shipyard Ltd"),
    ("IRFC", "Indian Railway Finance Corporation"),
    ("RECLTD", "REC Ltd"),
    ("PFC", "Power Finance Corporation Ltd"),
    ("NHPC", "NHPC Ltd"),
    ("SJVN", "SJVN Ltd"),
    ("TATAPOWER", "Tata Power Company Ltd"),
    ("ADANIPOWER", "Adani Power Ltd"),
    ("ADANIGREEN", "Adani Green Energy Ltd"),
    ("ADANITRANS", "Adani Energy Solutions Ltd"),
    ("JSWENERGY", "JSW Energy Ltd"),
    ("TORNTPOWER", "Torrent Power Ltd"),
    ("LUPIN", "Lupin Ltd"),
    ("BIOCON", "Biocon Ltd"),
    ("AUROPHARMA", "Aurobindo Pharma Ltd"),
    ("ZYDUSLIFE", "Zydus Lifesciences Ltd"),
    ("TORNTPHARM", "Torrent Pharmaceuticals Ltd"),
    ("ALKEM", "Alkem Laboratories Ltd"),
    ("GLENMARK", "Glenmark Pharmaceuticals Ltd"),
    ("LAURUSLABS", "Laurus Labs Ltd"),
    ("PERSISTENT", "Persistent Systems Ltd"),
    ("COFORGE", "Coforge Ltd"),
    ("MPHASIS", "Mphasis Ltd"),
    ("OFSS", "Oracle Financial Services Software"),
    ("TATAELXSI", "Tata Elxsi Ltd"),
    ("KPITTECH", "KPIT Technologies Ltd"),
    ("LTTS", "L&T Technology Services Ltd"),
    ("POLYCAB", "Polycab India Ltd"),
    ("ASTRAL", "Astral Ltd"),
    ("DIXON", "Dixon Technologies India Ltd"),
    ("AMBER", "Amber Enterprises India Ltd"),
    ("SUZLON", "Suzlon Energy Ltd"),
    ("IDEA", "Vodafone Idea Ltd"),
    ("YESBANK", "Yes Bank Ltd"),
    ("IRCON", "Ircon International Ltd"),
    ("RVNL", "Rail Vikas Nigam Ltd"),
    ("CONCOR", "Container Corporation of India"),
    ("PETRONET", "Petronet LNG Ltd"),
    ("IGL", "Indraprastha Gas Ltd"),
    ("MGL", "Mahanagar Gas Ltd"),
    ("GUJGASLTD", "Gujarat Gas Ltd"),
    ("SAIL", "Steel Authority of India Ltd"),
    ("NMDC", "NMDC Ltd"),
    ("JINDALSTEL", "Jindal Steel & Power Ltd"),
    ("APLAPOLLO", "APL Apollo Tubes Ltd"),
    ("RATNAMANI", "Ratnamani Metals & Tubes Ltd"),
    ("JUBLFOOD", "Jubilant Foodworks Ltd"),
    ("VBL", "Varun Beverages Ltd"),
    ("UBL", "United Breweries Ltd"),
    ("UNITDSPR", "United Spirits Ltd"),
    ("ABBOTINDIA", "Abbott India Ltd"),
    ("MANKIND", "Mankind Pharma Ltd"),
    ("GLAND", "Gland Pharma Ltd"),
    ("SYNGENE", "Syngene International Ltd"),
    ("INDHOTEL", "Indian Hotels Company Ltd"),
    ("LEMONTREE", "Lemon Tree Hotels Ltd"),
    ("CHALET", "Chalet Hotels Ltd"),
    ("PVRINOX", "PVR INOX Ltd"),
    ("ZEEL", "Zee Entertainment Enterprises Ltd"),
    ("SUNTV", "Sun TV Network Ltd"),
    ("NETWORK18", "Network18 Media & Investments Ltd"),
    ("UPL", "UPL Ltd"),
    ("PIIND", "PI Industries Ltd"),
    ("BAYERCROP", "Bayer CropScience Ltd"),
    ("SUMICHEM", "Sumitomo Chemical India Ltd"),
    ("DEEPAKNTR", "Deepak Nitrite Ltd"),
    ("NAVINFLUOR", "Navin Fluorine International Ltd"),
    ("SRF", "SRF Ltd"),
    ("AARTIIND", "Aarti Industries Ltd"),
    ("ATUL", "Atul Ltd"),
    ("GNFC", "Gujarat Narmada Valley Fertilizers"),
    ("CHAMBLFERT", "Chambal Fertilizers and Chemicals"),
    ("COROMANDEL", "Coromandel International Ltd"),
    ("FACT", "Fertilizers and Chemicals Travancore"),
    ("CONCOR", "Container Corporation of India"),
]

NSE_ETFS = [
    ("NIFTYBEES", "Nippon India ETF Nifty 50 BeES"),
    ("BANKBEES", "Nippon India ETF Nifty Bank BeES"),
    ("JUNIORBEES", "Nippon India ETF Nifty Next 50 Junior BeES"),
    ("GOLDBEES", "Nippon India ETF Gold BeES"),
    ("LIQUIDBEES", "Nippon India ETF Nifty 1D Rate Liquid BeES"),
    ("ITBEES", "Nippon India ETF Nifty IT"),
    ("PSUBNKBEES", "Nippon India ETF Nifty PSU Bank BeES"),
    ("CPSEETF", "CPSE ETF"),
    ("BHARATBOND", "BHARAT Bond ETF"),
    ("ICICINIFTY", "ICICI Prudential Nifty 50 ETF"),
    ("ICICIBANKN", "ICICI Prudential Nifty Bank ETF"),
    ("SETFNIF50", "SBI Nifty 50 ETF"),
    ("SETFNN50", "SBI Nifty Next 50 ETF"),
    ("SETFGOLD", "SBI Gold ETF"),
    ("HDFCNIFTY", "HDFC Nifty 50 ETF"),
    ("HDFCMID150", "HDFC Nifty Midcap 150 ETF"),
    ("MOM100", "Motilal Oswal Nifty Midcap 100 ETF"),
    ("MON100", "Motilal Oswal NASDAQ 100 ETF"),
    ("MAFANG", "Mirae Asset NYSE FANG+ ETF"),
    ("MASPTOP50", "Mirae Asset S&P 500 Top 50 ETF"),
    ("SILVERBEES", "Nippon India Silver ETF"),
    ("ICICISILVER", "ICICI Prudential Silver ETF"),
    ("HDFCSILVER", "HDFC Silver ETF"),
]


def get_all_symbols():
    """Return unified list of (symbol_ns, display_name, type) tuples."""
    out = []
    seen = set()
    for sym, name in NSE_STOCKS:
        key = sym.upper()
        if key in seen:
            continue
        seen.add(key)
        out.append({"symbol": f"{sym}.NS", "name": name, "type": "STOCK", "exchange": "NSE"})
    for sym, name in NSE_ETFS:
        key = sym.upper()
        if key in seen:
            continue
        seen.add(key)
        out.append({"symbol": f"{sym}.NS", "name": name, "type": "ETF", "exchange": "NSE"})
    return out


def search_symbols(query: str, limit: int = 15):
    """Case-insensitive prefix/substring search on symbol and name."""
    q = (query or "").strip().upper()
    if not q:
        return []
    all_syms = get_all_symbols()
    # Rank: symbol-prefix > symbol-contains > name-contains
    prefix, sym_contains, name_contains = [], [], []
    for s in all_syms:
        sym = s["symbol"].replace(".NS", "").upper()
        name = s["name"].upper()
        if sym.startswith(q):
            prefix.append(s)
        elif q in sym:
            sym_contains.append(s)
        elif q in name:
            name_contains.append(s)
    return (prefix + sym_contains + name_contains)[:limit]
