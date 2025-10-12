import { ImessageDatabase } from "../lib/db";

async function main() {
  let db: ImessageDatabase | null = null;

  try {
    // 1. 连接到 iMessage 数据库
    console.log("正在连接到 iMessage 数据库...");
    db = new ImessageDatabase();

    // 2. 获取最新消息 ID
    console.log("\n获取最新消息 ID:");
    const latestMessageId = db.getLatestMessage();
    console.log("最新消息 ID:", latestMessageId);

    // 3. 获取最近的聊天记录
    console.log("\n获取最近的 5 个聊天:");
    const recentChats = db.getRecentChats({ limit: 5, format: true });
    console.log("最近聊天:", JSON.stringify(recentChats, null, 2));

    // 4. 如果有聊天记录，获取第一个聊天的详细信息
    if (recentChats.length > 0 && recentChats[0]?.id) {
      const chatId = recentChats[0].id;

      console.log(`\n获取聊天 ID ${chatId} 的详细信息:`);
      const chatDetail = db.getChat(chatId);
      console.log("聊天详情:", JSON.stringify(chatDetail, null, 2));

      // 5. 获取该聊天的消息
      console.log(`\n获取聊天 ID ${chatId} 的最近 5 条消息:`);
      const messages = db.getChatMessages(chatId, { limit: 5, format: true });
      console.log("消息:", JSON.stringify(messages, null, 2));

      // 6. 使用 getMessages 方法获取消息
      console.log(`\n使用 getMessages 方法获取聊天 ID ${chatId} 的消息:`);
      const messagesAlt = db.getMessages(chatId, { limit: 5, format: true });
      console.log(
        "消息 (通过 getMessages):",
        JSON.stringify(messagesAlt, null, 2)
      );
    }
  } catch (error) {
    console.error("发生错误:", error);
  } finally {
    // 7. 关闭数据库连接
    console.log("\n关闭数据库连接...");
    db?.closeConnection();
  }
}

main();
