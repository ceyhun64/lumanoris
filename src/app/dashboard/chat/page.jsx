"use client";
import MessageInput from "@/app/components/MessageInput/MessageInput";
import ProfileCard from "@/app/components/ProfileCard/ProfileCard";
import WithdrawalModal from "@/app/components/WithdrawalModal/WithdrawalModal";
import React, { useState } from "react";

export default function Chat() {



    return (
        <div className="chat-wrapper">

            <div className="chat-header">
                <h2>Merhaba Adnan</h2>
            </div>

            <div className="chat-bottom">
                <ProfileCard />
                <MessageInput/>
            </div>



        </div>
    );
}
