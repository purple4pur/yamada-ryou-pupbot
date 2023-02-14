export BOT_ROOT := $(shell pwd)
APPID_DIR := $(BOT_ROOT)/data/appid

.PHONY: start
start: $(APPID_DIR)/appid_name.txt
	pup start

$(APPID_DIR)/appid_name.txt:
	$(MAKE) -C $(APPID_DIR) update
